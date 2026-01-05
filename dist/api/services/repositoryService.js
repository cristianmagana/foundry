"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepositoryService = void 0;
const getRepositoryService = (client, log) => {
    const updateDefaultBranch = async (fullName, defaultBranch) => {
        const [owner, repo] = fullName.split('/');
        log.info(`Updating default branch to: ${defaultBranch}`);
        try {
            // First, check if the branch exists or needs to be created
            // If auto_init is true, the default branch (master or main) will exist
            // We need to rename it or create the new branch and set it as default
            // Get current default branch
            const { data: repoData } = await client.repos.get({ owner, repo });
            const currentDefaultBranch = repoData.default_branch;
            if (currentDefaultBranch === defaultBranch) {
                log.info(`Default branch is already set to ${defaultBranch}`);
                return;
            }
            // Try to rename the branch (GitHub will handle creating the new branch)
            try {
                await client.repos.renameBranch({
                    owner,
                    repo,
                    branch: currentDefaultBranch,
                    new_name: defaultBranch,
                });
                log.info(`Successfully renamed branch from ${currentDefaultBranch} to ${defaultBranch}`);
            }
            catch (error) {
                // If rename fails (e.g., branch doesn't exist), just update the default branch setting
                log.warn(`Could not rename branch: ${error}. Attempting to update default branch setting.`);
                await client.repos.update({
                    owner,
                    repo,
                    default_branch: defaultBranch,
                });
                log.info(`Updated default branch setting to ${defaultBranch}`);
            }
        }
        catch (error) {
            log.warn(`Failed to update default branch: ${error}`);
            // Don't throw - this is a non-critical failure
        }
    };
    const createFromTemplate = async (input) => {
        if (!input.template) {
            throw new Error('Template repository is required');
        }
        const [templateOwner, templateRepo] = input.template.split('/');
        if (!templateOwner || !templateRepo) {
            throw new Error('Invalid template format. Expected format: owner/repository');
        }
        log.info(`Creating repository from template: ${templateOwner}/${templateRepo}`);
        try {
            const response = await client.repos.createUsingTemplate({
                template_owner: templateOwner,
                template_repo: templateRepo,
                owner: input.organization || undefined,
                name: input.name,
                description: input.description,
                private: input.private,
                include_all_branches: false,
                delete_branch_on_merge: true,
            });
            const result = {
                id: response.data.id,
                full_name: response.data.full_name,
                html_url: response.data.html_url,
            };
            // Update default branch if specified and different from current
            if (input.defaultBranch && input.defaultBranch !== response.data.default_branch) {
                await updateDefaultBranch(result.full_name, input.defaultBranch);
            }
            return result;
        }
        catch (error) {
            throw new Error(`Failed to create repository from template: ${error}`);
        }
    };
    const createNewRepository = async (input) => {
        log.info('Creating new repository');
        try {
            let response;
            if (input.organization) {
                // Create in organization
                response = await client.repos.createInOrg({
                    org: input.organization,
                    name: input.name,
                    description: input.description,
                    private: input.private,
                    auto_init: input.autoInit,
                    gitignore_template: input.gitignoreTemplate || undefined,
                    license_template: input.licenseTemplate || undefined,
                    delete_branch_on_merge: true,
                    allow_squash_merge: true,
                    allow_rebase_merge: true,
                });
            }
            else {
                // Create for authenticated user
                response = await client.repos.createForAuthenticatedUser({
                    name: input.name,
                    description: input.description,
                    private: input.private,
                    auto_init: input.autoInit,
                    gitignore_template: input.gitignoreTemplate || undefined,
                    license_template: input.licenseTemplate || undefined,
                });
            }
            const result = {
                id: response.data.id,
                full_name: response.data.full_name,
                html_url: response.data.html_url,
            };
            // Update default branch if specified and different from current
            // Note: GitHub API doesn't support default_branch during creation,
            // so we need to update it after creation
            if (input.defaultBranch && input.defaultBranch !== response.data.default_branch) {
                await updateDefaultBranch(result.full_name, input.defaultBranch);
            }
            return result;
        }
        catch (error) {
            throw new Error(`Failed to create new repository: ${error}`);
        }
    };
    const createRepository = async (input) => {
        try {
            // If template is provided, create from template
            if (input.template) {
                return await createFromTemplate(input);
            }
            // Otherwise, create a new repository
            return await createNewRepository(input);
        }
        catch (error) {
            throw new Error(`Failed to create repository: ${error}`);
        }
    };
    return {
        createRepository,
        createFromTemplate,
        createNewRepository,
    };
};
exports.getRepositoryService = getRepositoryService;
//# sourceMappingURL=repositoryService.js.map