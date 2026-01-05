"use strict";
/**
 * Productionalization service for GitHub repositories
 * Handles team permissions, environments, branch protection, topics, and secrets
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductionalizationService = void 0;
const caseConverter_1 = require("../../util/caseConverter");
const secretEncryption_1 = require("../../util/secretEncryption");
/**
 * Resolves a team slug to its numeric ID
 *
 * @param org - Organization name
 * @param teamSlug - Team slug
 * @returns Team ID
 */
const resolveTeamSlugToId = async (client, log, org, teamSlug) => {
    try {
        log.info(`Resolving team slug: ${teamSlug}`);
        const response = await client.rest.teams.getByName({
            org,
            team_slug: teamSlug,
        });
        return response.data.id;
    }
    catch (error) {
        throw new Error(`Failed to resolve team slug '${teamSlug}': ${error instanceof Error ? error.message : String(error)}`);
    }
};
/**
 * Resolves a username to its numeric ID
 *
 * @param username - GitHub username
 * @returns User ID
 */
const resolveUsernameToId = async (client, log, username) => {
    try {
        log.info(`Resolving username: ${username}`);
        const response = await client.rest.users.getByUsername({
            username,
        });
        return response.data.id;
    }
    catch (error) {
        throw new Error(`Failed to resolve username '${username}': ${error instanceof Error ? error.message : String(error)}`);
    }
};
/**
 * Adds team permissions to a repository
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param teams - Team permission configurations
 * @returns Results for each team operation
 */
const addTeamPermissions = async (client, log, owner, repo, teams) => {
    log.info(`Adding team permissions for ${owner}/${repo}`);
    const permissionPromises = teams.map(async (team) => {
        try {
            await client.rest.teams.addOrUpdateRepoPermissionsInOrg({
                org: owner,
                team_slug: team.teamSlug,
                owner,
                repo,
                permission: team.permission,
            });
            log.info(`Added ${team.permission} permission for team: ${team.teamSlug}`);
            return {
                teamSlug: team.teamSlug,
                success: true,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Failed to add permission for team ${team.teamSlug}: ${errorMessage}`);
            return {
                teamSlug: team.teamSlug,
                success: false,
                error: errorMessage,
            };
        }
    });
    return Promise.all(permissionPromises);
};
/**
 * Merges topics with existing repository topics
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param newTopics - Topics to add/merge
 */
const mergeTopics = async (client, log, owner, repo, newTopics) => {
    log.info(`Merging topics for repository ${owner}/${repo}`);
    // Fetch existing topics
    const existingTopicsResponse = await client.rest.repos.getAllTopics({
        owner,
        repo,
    });
    const existingTopics = existingTopicsResponse.data.names;
    // Merge and deduplicate
    const mergedTopics = [...new Set([...existingTopics, ...newTopics])];
    log.info(`Merged topics: ${mergedTopics.join(', ')}`);
    // Replace all topics with merged list
    await client.rest.repos.replaceAllTopics({
        owner,
        repo,
        names: mergedTopics,
    });
};
/**
 * Creates repository environments with reviewers
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param environments - Environment configurations
 * @returns Results for each environment operation
 */
const createEnvironments = async (client, log, owner, repo, environments) => {
    log.info(`Creating environments for ${owner}/${repo}`);
    const created = [];
    const errors = [];
    for (const env of environments) {
        try {
            log.info(`Creating environment: ${env.name}`);
            // Resolve reviewers if provided
            let reviewers;
            if (env.reviewers && env.reviewers.length > 0) {
                reviewers = await Promise.all(env.reviewers.map(async (reviewer) => {
                    if (reviewer.type === 'Team') {
                        const id = await resolveTeamSlugToId(client, log, owner, reviewer.slug);
                        return { type: reviewer.type, id };
                    }
                    else {
                        const id = await resolveUsernameToId(client, log, reviewer.slug);
                        return { type: reviewer.type, id };
                    }
                }));
            }
            // Build request parameters
            const requestParams = {
                owner,
                repo,
                environment_name: env.name,
                deployment_branch_policy: {
                    protected_branches: false,
                    custom_branch_policies: true,
                },
            };
            if (env.waitTimer !== undefined) {
                requestParams.wait_timer = env.waitTimer;
            }
            if (reviewers && reviewers.length > 0) {
                requestParams.reviewers = reviewers;
            }
            if (env.preventSelfReview !== undefined) {
                requestParams.prevent_self_review = env.preventSelfReview;
            }
            await client.rest.repos.createOrUpdateEnvironment(requestParams);
            log.info(`Successfully created environment: ${env.name}`);
            created.push(env.name);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Failed to create environment ${env.name}: ${errorMessage}`);
            errors.push({
                environment: env.name,
                success: false,
                error: errorMessage,
            });
        }
    }
    return { created, errors };
};
/**
 * Sets environment variables for environments
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param envVars - Environment variable configurations
 * @param createdEnvironments - List of successfully created environments
 * @returns Results for variable operations
 */
const setEnvironmentVariables = async (client, log, owner, repo, envVars, createdEnvironments) => {
    log.info(`Setting environment variables for ${owner}/${repo}`);
    let created = 0;
    const errors = [];
    for (const envVar of envVars) {
        // Skip if environment wasn't created successfully
        if (!createdEnvironments.includes(envVar.environmentName)) {
            log.warn(`Skipping variables for environment ${envVar.environmentName} (environment not created)`);
            continue;
        }
        for (const variable of envVar.variables) {
            try {
                // Convert variable name to UPPER_SNAKE_CASE
                const variableName = (0, caseConverter_1.toUpperSnakeCase)(variable.name);
                log.info(`Setting variable ${variableName} for environment ${envVar.environmentName}`);
                // Check if variable exists
                let exists = false;
                try {
                    await client.rest.actions.getEnvironmentVariable({
                        owner,
                        repo,
                        environment_name: envVar.environmentName,
                        name: variableName,
                    });
                    exists = true;
                }
                catch {
                    // Variable doesn't exist, will create it
                }
                if (exists) {
                    // Update existing variable
                    await client.rest.actions.updateEnvironmentVariable({
                        owner,
                        repo,
                        environment_name: envVar.environmentName,
                        name: variableName,
                        value: variable.value,
                    });
                }
                else {
                    // Create new variable
                    await client.rest.actions.createEnvironmentVariable({
                        owner,
                        repo,
                        environment_name: envVar.environmentName,
                        name: variableName,
                        value: variable.value,
                    });
                }
                log.info(`Successfully set variable ${variableName} for environment ${envVar.environmentName}`);
                created++;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                log.error(`Failed to set variable ${variable.name} for environment ${envVar.environmentName}: ${errorMessage}`);
                errors.push({
                    environment: envVar.environmentName,
                    variable: variable.name,
                    success: false,
                    error: errorMessage,
                });
            }
        }
    }
    return { created, errors };
};
/**
 * Creates branch protection using a preset
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param preset - Branch protection preset name
 * @param targetBranch - Branch to protect
 */
const createBranchProtection = async (client, log, owner, repo, preset, targetBranch = 'master') => {
    log.info(`Creating ${preset} branch protection for ${owner}/${repo}/${targetBranch}`);
    // Build rules based on preset
    let requiredApprovals = 1;
    let dismissStaleReviews = true;
    let requireLastPushApproval = true;
    let requireThreadResolution = true;
    let presetName = 'Branch protection rules (moderate)';
    if (preset === 'strict') {
        requiredApprovals = 2;
        presetName = 'Branch protection rules (strict)';
    }
    else if (preset === 'minimal') {
        dismissStaleReviews = false;
        requireLastPushApproval = false;
        requireThreadResolution = false;
        presetName = 'Branch protection rules (minimal)';
    }
    await client.rest.repos.createRepoRuleset({
        owner,
        repo,
        name: presetName,
        target: 'branch',
        enforcement: 'active',
        conditions: {
            ref_name: {
                include: [`refs/heads/${targetBranch}`],
                exclude: [],
            },
        },
        rules: [
            {
                type: 'pull_request',
                parameters: {
                    dismiss_stale_reviews_on_push: dismissStaleReviews,
                    require_code_owner_review: false,
                    require_last_push_approval: requireLastPushApproval,
                    required_approving_review_count: requiredApprovals,
                    required_review_thread_resolution: requireThreadResolution,
                },
            },
            {
                type: 'non_fast_forward',
            },
        ],
    });
    log.info(`Successfully created branch protection: ${presetName}`);
};
/**
 * Creates repository secrets
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param secrets - Repository secrets to create
 * @returns Results for secret operations
 */
const createRepositorySecrets = async (client, log, owner, repo, secrets) => {
    log.info(`Creating repository secrets for ${owner}/${repo}`);
    let created = 0;
    const errors = [];
    // Get repository public key for encryption
    let publicKey;
    try {
        const response = await client.rest.actions.getRepoPublicKey({
            owner,
            repo,
        });
        publicKey = {
            key: response.data.key,
            key_id: response.data.key_id,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get repository public key: ${errorMessage}`);
    }
    // Create secrets in parallel
    const secretPromises = secrets.map(async (secret) => {
        try {
            // Encrypt the secret value
            const encryptedValue = await (0, secretEncryption_1.encryptSecret)(publicKey.key, secret.value);
            // Create or update the secret
            await client.rest.actions.createOrUpdateRepoSecret({
                owner,
                repo,
                secret_name: secret.name,
                encrypted_value: encryptedValue,
                key_id: publicKey.key_id,
            });
            log.info(`Created/updated secret: ${secret.name}`);
            return {
                secret: secret.name,
                success: true,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Failed to create secret ${secret.name}: ${errorMessage}`);
            return {
                secret: secret.name,
                success: false,
                error: errorMessage,
            };
        }
    });
    const results = await Promise.all(secretPromises);
    results.forEach(result => {
        if (result.success) {
            created++;
        }
        else {
            errors.push(result);
        }
    });
    return { created, errors };
};
/**
 * Main productionalization orchestration function
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param config - Productionalization configuration
 * @returns Detailed results of all operations
 */
const productionalizeRepository = async (client, log, owner, repo, config) => {
    log.info(`Starting productionalization for ${owner}/${repo}`);
    // Add small delay to ensure repository is ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    const result = {
        teamPermissions: [],
        topicsAdded: false,
        environmentsCreated: [],
        environmentErrors: [],
        variablesCreated: 0,
        variableErrors: [],
        branchProtectionCreated: false,
        secretsCreated: 0,
        secretErrors: [],
    };
    // Phase 1: Parallel operations (team permissions, topics, branch protection)
    const parallelTasks = [];
    // Team permissions
    if (config.teamPermissions && config.teamPermissions.length > 0) {
        parallelTasks.push((async () => {
            try {
                result.teamPermissions = await addTeamPermissions(client, log, owner, repo, config.teamPermissions);
            }
            catch (error) {
                log.error(`Team permissions failed: ${error}`);
            }
        })());
    }
    // Topics
    if (config.topics && config.topics.length > 0) {
        parallelTasks.push((async () => {
            try {
                await mergeTopics(client, log, owner, repo, config.topics);
                result.topicsAdded = true;
            }
            catch (error) {
                result.topicsError = error instanceof Error ? error.message : String(error);
                log.error(`Topics merge failed: ${result.topicsError}`);
            }
        })());
    }
    // Branch protection
    if (config.branchProtectionPreset) {
        parallelTasks.push((async () => {
            try {
                await createBranchProtection(client, log, owner, repo, config.branchProtectionPreset, config.branchProtectionTargetBranch);
                result.branchProtectionCreated = true;
            }
            catch (error) {
                result.branchProtectionError =
                    error instanceof Error ? error.message : String(error);
                log.error(`Branch protection failed: ${result.branchProtectionError}`);
            }
        })());
    }
    await Promise.all(parallelTasks);
    // Phase 2: Sequential environment setup
    if (config.environments && config.environments.length > 0) {
        try {
            const envResults = await createEnvironments(client, log, owner, repo, config.environments);
            result.environmentsCreated = envResults.created;
            result.environmentErrors = envResults.errors;
            // Set environment variables for successfully created environments
            if (config.environmentVariables && config.environmentVariables.length > 0) {
                const varResults = await setEnvironmentVariables(client, log, owner, repo, config.environmentVariables, envResults.created);
                result.variablesCreated = varResults.created;
                result.variableErrors = varResults.errors;
            }
        }
        catch (error) {
            log.error(`Environment setup failed: ${error}`);
        }
    }
    // Phase 3: Secrets creation
    if (config.secrets && config.secrets.length > 0) {
        try {
            const secretResults = await createRepositorySecrets(client, log, owner, repo, config.secrets);
            result.secretsCreated = secretResults.created;
            result.secretErrors = secretResults.errors;
        }
        catch (error) {
            log.error(`Secrets creation failed: ${error}`);
        }
    }
    log.info(`Productionalization complete for ${owner}/${repo}`);
    return result;
};
/**
 * Factory function to create a productionalization service
 *
 * @param client - Octokit client
 * @param log - Logger instance
 * @returns ProductionalizationService
 */
const getProductionalizationService = (client, log) => {
    return {
        productionalizeRepository: (owner, repo, config) => productionalizeRepository(client, log, owner, repo, config),
    };
};
exports.getProductionalizationService = getProductionalizationService;
//# sourceMappingURL=productionalizationService.js.map