/**
 * Type definitions for GitHub repository productionalization features
 */

/**
 * GitHub team permission levels
 * @see https://docs.github.com/en/rest/teams/teams#add-or-update-team-repository-permissions
 */
export type TeamPermission =
    | 'pull' // Read-only access
    | 'triage' // Triage access (read + limited write)
    | 'push' // Read and write access
    | 'maintain' // Maintain access (push + some admin)
    | 'admin'; // Full administrative access

/**
 * Configuration for a single team permission
 */
export type TeamPermissionConfig = {
    teamSlug: string; // GitHub team slug (will be resolved to ID)
    permission: TeamPermission;
};

/**
 * Reviewer type for environment protection rules
 */
export type ReviewerType = 'User' | 'Team';

/**
 * Environment reviewer configuration
 * Can specify either a username (User) or team slug (Team)
 */
export type EnvironmentReviewer = {
    type: ReviewerType;
    slug: string; // Username or team slug (will be resolved to ID)
};

/**
 * GitHub environment configuration
 */
export type EnvironmentConfig = {
    name: string; // Environment name (e.g., 'production', 'staging', 'development')
    waitTimer?: number; // Wait time in minutes before deployment (0-43200)
    reviewers?: EnvironmentReviewer[]; // Required reviewers for deployment
    preventSelfReview?: boolean; // Prevent self-review (requires reviewers)
};

/**
 * Single environment variable
 */
export type EnvironmentVariable = {
    name: string; // Variable name (will be converted to UPPER_SNAKE_CASE)
    value: string; // Variable value
};

/**
 * Environment variables for a specific environment
 */
export type EnvironmentVariables = {
    environmentName: string; // Must match an environment name from EnvironmentConfig
    variables: EnvironmentVariable[];
};

/**
 * Branch protection preset levels
 */
export type BranchProtectionPreset = 'strict' | 'moderate' | 'minimal';

/**
 * Repository secret configuration
 */
export type RepositorySecret = {
    name: string; // Secret name (UPPER_CASE recommended)
    value: string; // Secret value (will be encrypted before upload)
};

/**
 * Complete productionalization configuration
 * All fields are optional to allow flexible feature enablement
 */
export type ProductionalizationConfig = {
    teamPermissions?: TeamPermissionConfig[];
    topics?: string[];
    environments?: EnvironmentConfig[];
    environmentVariables?: EnvironmentVariables[];
    branchProtectionPreset?: BranchProtectionPreset;
    branchProtectionTargetBranch?: string; // Default: 'master'
    secrets?: RepositorySecret[];
};

/**
 * Result of a single team permission operation
 */
export type TeamPermissionResult = {
    teamSlug: string;
    success: boolean;
    error?: string;
};

/**
 * Result of environment creation
 */
export type EnvironmentCreationResult = {
    environment: string;
    success: boolean;
    error?: string;
};

/**
 * Result of environment variable operation
 */
export type EnvironmentVariableResult = {
    environment: string;
    variable: string;
    success: boolean;
    error?: string;
};

/**
 * Result of secret creation
 */
export type SecretCreationResult = {
    secret: string;
    success: boolean;
    error?: string;
};

/**
 * Comprehensive productionalization result tracking
 * Provides detailed success/failure information for each operation
 */
export type ProductionalizationResult = {
    // Team permissions
    teamPermissions: TeamPermissionResult[];

    // Topics
    topicsAdded: boolean;
    topicsError?: string;

    // Environments
    environmentsCreated: string[];
    environmentErrors: EnvironmentCreationResult[];

    // Environment variables
    variablesCreated: number;
    variableErrors: EnvironmentVariableResult[];

    // Branch protection
    branchProtectionCreated: boolean;
    branchProtectionError?: string;

    // Secrets
    secretsCreated: number;
    secretErrors: SecretCreationResult[];
};
