/**
 * Input parsing and validation utilities for GitHub Action inputs
 */
import { TeamPermissionConfig, EnvironmentConfig, EnvironmentVariables, BranchProtectionPreset, RepositorySecret } from '../api/types/productionalization';
/**
 * Parses team permissions from JSON string or returns empty array if input is empty
 *
 * @param input - JSON string containing team permission configurations
 * @returns Array of TeamPermissionConfig objects
 * @throws Error if JSON is invalid
 */
export declare const parseTeamPermissions: (input: string) => TeamPermissionConfig[];
/**
 * Parses topics from comma-separated string or JSON array
 *
 * @param input - Comma-separated topics or JSON array
 * @returns Array of topic strings
 */
export declare const parseTopics: (input: string) => string[];
/**
 * Parses environment configurations from JSON string
 *
 * @param input - JSON string containing environment configurations
 * @returns Array of EnvironmentConfig objects
 * @throws Error if JSON is invalid
 */
export declare const parseEnvironments: (input: string) => EnvironmentConfig[];
/**
 * Parses environment variables from JSON string
 *
 * @param input - JSON string containing environment variable mappings
 * @returns Array of EnvironmentVariables objects
 * @throws Error if JSON is invalid
 */
export declare const parseEnvironmentVariables: (input: string) => EnvironmentVariables[];
/**
 * Parses and validates branch protection preset
 *
 * @param input - Branch protection preset name
 * @returns BranchProtectionPreset or undefined if input is empty
 * @throws Error if preset is invalid
 */
export declare const parseBranchProtectionPreset: (input: string) => BranchProtectionPreset | undefined;
/**
 * Parses repository secrets from JSON string
 *
 * @param input - JSON string containing repository secrets
 * @returns Array of RepositorySecret objects
 * @throws Error if JSON is invalid
 */
export declare const parseSecrets: (input: string) => RepositorySecret[];
//# sourceMappingURL=inputParser.d.ts.map