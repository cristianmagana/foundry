import * as core from '@actions/core';
import {FoundryInitializer} from './types/types';
import {RepositoryInput} from './api/types/repository';
import {getLogger} from './util/logger';
import {getOctokitClient} from './config/config';
import {getRepositoryService} from './api/services/repositoryService';
import {getProductionalizationService} from './api/services/productionalizationService';
import {ProductionalizationConfig} from './api/types/productionalization';
import {
    parseTeamPermissions,
    parseTopics,
    parseEnvironments,
    parseEnvironmentVariables,
    parseBranchProtectionPreset,
    parseSecrets,
} from './util/inputParser';
import {
    APP_NAME,
    DEFAULT_PRODUCTIONALIZE,
    DEFAULT_BRANCH_PROTECTION_TARGET,
} from './constants/constants';

const getInitializer = async (): Promise<FoundryInitializer> => {
    try {
        // 1. Gather input from GitHub Actions
        const input: RepositoryInput = {
            token: core.getInput('github-token', {required: true}),
            name: core.getInput('repository-name', {required: true}),
            description: core.getInput('repository-description'),
            private: core.getInput('repository-private') === 'true',
            template: core.getInput('repository-template'),
            organization: core.getInput('organization'),
            autoInit: core.getInput('auto-init') === 'true',
            gitignoreTemplate: core.getInput('gitignore-template'),
            licenseTemplate: core.getInput('license-template'),
            defaultBranch: core.getInput('default-branch') || 'main',
        };

        // Parse productionalization inputs
        const productionalize =
            core.getInput('productionalize') === 'true' || DEFAULT_PRODUCTIONALIZE;

        if (productionalize) {
            const productionalizationConfig: ProductionalizationConfig = {};

            // Parse team permissions
            const teamPermissionsInput = core.getInput('team-permissions');
            if (teamPermissionsInput) {
                productionalizationConfig.teamPermissions =
                    parseTeamPermissions(teamPermissionsInput);
            }

            // Parse topics
            const topicsInput = core.getInput('repository-topics');
            if (topicsInput) {
                productionalizationConfig.topics = parseTopics(topicsInput);
            }

            // Parse environments
            const environmentsInput = core.getInput('environments');
            if (environmentsInput) {
                productionalizationConfig.environments = parseEnvironments(environmentsInput);
            }

            // Parse environment variables
            const envVarsInput = core.getInput('environment-variables');
            if (envVarsInput) {
                productionalizationConfig.environmentVariables =
                    parseEnvironmentVariables(envVarsInput);
            }

            // Parse branch protection preset
            const branchProtectionInput = core.getInput('branch-protection-preset');
            if (branchProtectionInput) {
                productionalizationConfig.branchProtectionPreset =
                    parseBranchProtectionPreset(branchProtectionInput);

                const targetBranch =
                    core.getInput('branch-protection-target-branch') ||
                    DEFAULT_BRANCH_PROTECTION_TARGET;
                productionalizationConfig.branchProtectionTargetBranch = targetBranch;
            }

            // Parse secrets
            const secretsInput = core.getInput('repository-secrets');
            if (secretsInput) {
                productionalizationConfig.secrets = parseSecrets(secretsInput);
            }

            input.productionalize = true;
            input.productionalizationConfig = productionalizationConfig;
        }

        // 2. Initialize logger and clients
        const log = getLogger(APP_NAME);
        const octokitClient = getOctokitClient(input.token);

        // 3. Return complete initializer object
        return {input, octokitClient, log};
    } catch (error) {
        throw new Error(`Failed to initialize Foundry: ${error}`);
    }
};

// Eager initialization
const initialize = getInitializer();

export const run = async (): Promise<void> => {
    try {
        // Wait for initialization to complete
        const {input, octokitClient, log} = await initialize;

        log.info('Foundry initialized');
        log.info(`Creating repository: ${input.name}`);

        // Get repository service with injected dependencies
        const repositoryService = getRepositoryService(octokitClient, log);

        // Create the repository
        const result = await repositoryService.createRepository(input);

        // Set outputs
        core.setOutput('repository-url', result.html_url);
        core.setOutput('repository-name', result.full_name);
        core.setOutput('repository-id', result.id.toString());

        log.info(`Repository created successfully: ${result.html_url}`);
        core.info(`Repository created successfully: ${result.html_url}`);

        // Productionalization (if enabled)
        if (input.productionalize && input.productionalizationConfig) {
            log.info('Starting repository productionalization...');
            core.info('Starting repository productionalization...');

            const productionalizationService = getProductionalizationService(octokitClient, log);

            // Extract owner and repo from full_name
            const [owner, repo] = result.full_name.split('/');

            const prodResult = await productionalizationService.productionalizeRepository(
                owner,
                repo,
                input.productionalizationConfig
            );

            // Set productionalization status output
            core.setOutput('productionalization-status', JSON.stringify(prodResult));

            // Log summary
            log.info('Productionalization complete');
            log.info(
                `- Team permissions: ${prodResult.teamPermissions.filter(t => t.success).length}/${prodResult.teamPermissions.length} successful`
            );
            log.info(`- Topics added: ${prodResult.topicsAdded}`);
            log.info(`- Environments created: ${prodResult.environmentsCreated.length}`);
            log.info(`- Variables created: ${prodResult.variablesCreated}`);
            log.info(`- Branch protection created: ${prodResult.branchProtectionCreated}`);
            log.info(`- Secrets created: ${prodResult.secretsCreated}`);

            core.info('Repository productionalization complete');
        }
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed('An unknown error occurred');
        }
    }
};
