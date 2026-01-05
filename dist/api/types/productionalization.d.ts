/**
 * Type definitions for GitHub repository productionalization features
 */
/**
 * GitHub team permission levels
 * @see https://docs.github.com/en/rest/teams/teams#add-or-update-team-repository-permissions
 */
export type TeamPermission = 'pull' | 'triage' | 'push' | 'maintain' | 'admin';
/**
 * Configuration for a single team permission
 */
export type TeamPermissionConfig = {
    teamSlug: string;
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
    slug: string;
};
/**
 * GitHub environment configuration
 */
export type EnvironmentConfig = {
    name: string;
    waitTimer?: number;
    reviewers?: EnvironmentReviewer[];
    preventSelfReview?: boolean;
};
/**
 * Single environment variable
 */
export type EnvironmentVariable = {
    name: string;
    value: string;
};
/**
 * Environment variables for a specific environment
 */
export type EnvironmentVariables = {
    environmentName: string;
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
    name: string;
    value: string;
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
    branchProtectionTargetBranch?: string;
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
    teamPermissions: TeamPermissionResult[];
    topicsAdded: boolean;
    topicsError?: string;
    environmentsCreated: string[];
    environmentErrors: EnvironmentCreationResult[];
    variablesCreated: number;
    variableErrors: EnvironmentVariableResult[];
    branchProtectionCreated: boolean;
    branchProtectionError?: string;
    secretsCreated: number;
    secretErrors: SecretCreationResult[];
};
//# sourceMappingURL=productionalization.d.ts.map