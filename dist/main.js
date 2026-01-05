"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const logger_1 = require("./util/logger");
const config_1 = require("./config/config");
const repositoryService_1 = require("./api/services/repositoryService");
const productionalizationService_1 = require("./api/services/productionalizationService");
const inputParser_1 = require("./util/inputParser");
const constants_1 = require("./constants/constants");
const getInitializer = async () => {
    try {
        // 1. Gather input from GitHub Actions
        const input = {
            token: core.getInput('github-token', { required: true }),
            name: core.getInput('repository-name', { required: true }),
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
        const productionalize = core.getInput('productionalize') === 'true' || constants_1.DEFAULT_PRODUCTIONALIZE;
        if (productionalize) {
            const productionalizationConfig = {};
            // Parse team permissions
            const teamPermissionsInput = core.getInput('team-permissions');
            if (teamPermissionsInput) {
                productionalizationConfig.teamPermissions =
                    (0, inputParser_1.parseTeamPermissions)(teamPermissionsInput);
            }
            // Parse topics
            const topicsInput = core.getInput('repository-topics');
            if (topicsInput) {
                productionalizationConfig.topics = (0, inputParser_1.parseTopics)(topicsInput);
            }
            // Parse environments
            const environmentsInput = core.getInput('environments');
            if (environmentsInput) {
                productionalizationConfig.environments = (0, inputParser_1.parseEnvironments)(environmentsInput);
            }
            // Parse environment variables
            const envVarsInput = core.getInput('environment-variables');
            if (envVarsInput) {
                productionalizationConfig.environmentVariables =
                    (0, inputParser_1.parseEnvironmentVariables)(envVarsInput);
            }
            // Parse branch protection preset
            const branchProtectionInput = core.getInput('branch-protection-preset');
            if (branchProtectionInput) {
                productionalizationConfig.branchProtectionPreset =
                    (0, inputParser_1.parseBranchProtectionPreset)(branchProtectionInput);
                const targetBranch = core.getInput('branch-protection-target-branch') ||
                    constants_1.DEFAULT_BRANCH_PROTECTION_TARGET;
                productionalizationConfig.branchProtectionTargetBranch = targetBranch;
            }
            // Parse secrets
            const secretsInput = core.getInput('repository-secrets');
            if (secretsInput) {
                productionalizationConfig.secrets = (0, inputParser_1.parseSecrets)(secretsInput);
            }
            input.productionalize = true;
            input.productionalizationConfig = productionalizationConfig;
        }
        // 2. Initialize logger and clients
        const log = (0, logger_1.getLogger)(constants_1.APP_NAME);
        const octokitClient = (0, config_1.getOctokitClient)(input.token);
        // 3. Return complete initializer object
        return { input, octokitClient, log };
    }
    catch (error) {
        throw new Error(`Failed to initialize Foundry: ${error}`);
    }
};
// Eager initialization
const initialize = getInitializer();
const run = async () => {
    try {
        // Wait for initialization to complete
        const { input, octokitClient, log } = await initialize;
        log.info('Foundry initialized');
        log.info(`Creating repository: ${input.name}`);
        // Get repository service with injected dependencies
        const repositoryService = (0, repositoryService_1.getRepositoryService)(octokitClient, log);
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
            const productionalizationService = (0, productionalizationService_1.getProductionalizationService)(octokitClient, log);
            // Extract owner and repo from full_name
            const [owner, repo] = result.full_name.split('/');
            const prodResult = await productionalizationService.productionalizeRepository(owner, repo, input.productionalizationConfig);
            // Set productionalization status output
            core.setOutput('productionalization-status', JSON.stringify(prodResult));
            // Log summary
            log.info('Productionalization complete');
            log.info(`- Team permissions: ${prodResult.teamPermissions.filter(t => t.success).length}/${prodResult.teamPermissions.length} successful`);
            log.info(`- Topics added: ${prodResult.topicsAdded}`);
            log.info(`- Environments created: ${prodResult.environmentsCreated.length}`);
            log.info(`- Variables created: ${prodResult.variablesCreated}`);
            log.info(`- Branch protection created: ${prodResult.branchProtectionCreated}`);
            log.info(`- Secrets created: ${prodResult.secretsCreated}`);
            core.info('Repository productionalization complete');
        }
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed('An unknown error occurred');
        }
    }
};
exports.run = run;
//# sourceMappingURL=main.js.map