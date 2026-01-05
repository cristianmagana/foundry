"use strict";
/**
 * Input parsing and validation utilities for GitHub Action inputs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSecrets = exports.parseBranchProtectionPreset = exports.parseEnvironmentVariables = exports.parseEnvironments = exports.parseTopics = exports.parseTeamPermissions = void 0;
/**
 * Parses team permissions from JSON string or returns empty array if input is empty
 *
 * @param input - JSON string containing team permission configurations
 * @returns Array of TeamPermissionConfig objects
 * @throws Error if JSON is invalid
 */
const parseTeamPermissions = (input) => {
    if (!input || input.trim() === '' || input.trim() === '[]') {
        return [];
    }
    try {
        const parsed = JSON.parse(input);
        if (!Array.isArray(parsed)) {
            throw new Error('Team permissions must be an array');
        }
        return parsed.map((item, index) => {
            if (!item.teamSlug || typeof item.teamSlug !== 'string') {
                throw new Error(`Team permission at index ${index} missing valid teamSlug`);
            }
            if (!item.permission || typeof item.permission !== 'string') {
                throw new Error(`Team permission at index ${index} missing valid permission`);
            }
            const validPermissions = ['pull', 'triage', 'push', 'maintain', 'admin'];
            if (!validPermissions.includes(item.permission)) {
                throw new Error(`Team permission at index ${index} has invalid permission: ${item.permission}. Must be one of: ${validPermissions.join(', ')}`);
            }
            return {
                teamSlug: item.teamSlug,
                permission: item.permission,
            };
        });
    }
    catch (error) {
        throw new Error(`Failed to parse team permissions: ${error instanceof Error ? error.message : String(error)}`);
    }
};
exports.parseTeamPermissions = parseTeamPermissions;
/**
 * Parses topics from comma-separated string or JSON array
 *
 * @param input - Comma-separated topics or JSON array
 * @returns Array of topic strings
 */
const parseTopics = (input) => {
    if (!input || input.trim() === '') {
        return [];
    }
    // Try parsing as JSON array first
    if (input.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
                return parsed.filter(topic => typeof topic === 'string' && topic.trim() !== '');
            }
        }
        catch {
            // If JSON parsing fails, fall through to comma-separated parsing
        }
    }
    // Parse as comma-separated values
    return input
        .split(',')
        .map(topic => topic.trim())
        .filter(topic => topic !== '');
};
exports.parseTopics = parseTopics;
/**
 * Parses environment configurations from JSON string
 *
 * @param input - JSON string containing environment configurations
 * @returns Array of EnvironmentConfig objects
 * @throws Error if JSON is invalid
 */
const parseEnvironments = (input) => {
    if (!input || input.trim() === '' || input.trim() === '[]') {
        return [];
    }
    try {
        const parsed = JSON.parse(input);
        if (!Array.isArray(parsed)) {
            throw new Error('Environments must be an array');
        }
        return parsed.map((item, index) => {
            if (!item.name || typeof item.name !== 'string') {
                throw new Error(`Environment at index ${index} missing valid name`);
            }
            const config = {
                name: item.name,
            };
            if (item.waitTimer !== undefined) {
                if (typeof item.waitTimer !== 'number' || item.waitTimer < 0) {
                    throw new Error(`Environment ${item.name} has invalid waitTimer (must be a non-negative number)`);
                }
                config.waitTimer = item.waitTimer;
            }
            if (item.reviewers !== undefined) {
                if (!Array.isArray(item.reviewers)) {
                    throw new Error(`Environment ${item.name} reviewers must be an array`);
                }
                config.reviewers = item.reviewers.map((reviewer, rIndex) => {
                    if (!reviewer || typeof reviewer !== 'object') {
                        throw new Error(`Environment ${item.name} reviewer at index ${rIndex} must be an object`);
                    }
                    const rev = reviewer;
                    if (!rev.type || !['User', 'Team'].includes(rev.type)) {
                        throw new Error(`Environment ${item.name} reviewer at index ${rIndex} has invalid type (must be 'User' or 'Team')`);
                    }
                    if (!rev.slug || typeof rev.slug !== 'string') {
                        throw new Error(`Environment ${item.name} reviewer at index ${rIndex} missing valid slug`);
                    }
                    return {
                        type: rev.type,
                        slug: rev.slug,
                    };
                });
            }
            if (item.preventSelfReview !== undefined) {
                config.preventSelfReview = Boolean(item.preventSelfReview);
            }
            return config;
        });
    }
    catch (error) {
        throw new Error(`Failed to parse environments: ${error instanceof Error ? error.message : String(error)}`);
    }
};
exports.parseEnvironments = parseEnvironments;
/**
 * Parses environment variables from JSON string
 *
 * @param input - JSON string containing environment variable mappings
 * @returns Array of EnvironmentVariables objects
 * @throws Error if JSON is invalid
 */
const parseEnvironmentVariables = (input) => {
    if (!input || input.trim() === '' || input.trim() === '[]') {
        return [];
    }
    try {
        const parsed = JSON.parse(input);
        if (!Array.isArray(parsed)) {
            throw new Error('Environment variables must be an array');
        }
        return parsed.map((item, index) => {
            if (!item.environmentName || typeof item.environmentName !== 'string') {
                throw new Error(`Environment variables at index ${index} missing valid environmentName`);
            }
            if (!item.variables || !Array.isArray(item.variables)) {
                throw new Error(`Environment variables for ${item.environmentName} must contain a variables array`);
            }
            const variables = item.variables.map((variable, vIndex) => {
                if (!variable || typeof variable !== 'object') {
                    throw new Error(`Variable at index ${vIndex} for environment ${item.environmentName} must be an object`);
                }
                const v = variable;
                if (!v.name || typeof v.name !== 'string') {
                    throw new Error(`Variable at index ${vIndex} for environment ${item.environmentName} missing valid name`);
                }
                if (v.value === undefined || typeof v.value !== 'string') {
                    throw new Error(`Variable ${v.name} for environment ${item.environmentName} missing valid value`);
                }
                return {
                    name: v.name,
                    value: v.value,
                };
            });
            return {
                environmentName: item.environmentName,
                variables,
            };
        });
    }
    catch (error) {
        throw new Error(`Failed to parse environment variables: ${error instanceof Error ? error.message : String(error)}`);
    }
};
exports.parseEnvironmentVariables = parseEnvironmentVariables;
/**
 * Parses and validates branch protection preset
 *
 * @param input - Branch protection preset name
 * @returns BranchProtectionPreset or undefined if input is empty
 * @throws Error if preset is invalid
 */
const parseBranchProtectionPreset = (input) => {
    if (!input || input.trim() === '') {
        return undefined;
    }
    const validPresets = ['strict', 'moderate', 'minimal'];
    const preset = input.trim();
    if (!validPresets.includes(preset)) {
        throw new Error(`Invalid branch protection preset: ${input}. Must be one of: ${validPresets.join(', ')}`);
    }
    return preset;
};
exports.parseBranchProtectionPreset = parseBranchProtectionPreset;
/**
 * Parses repository secrets from JSON string
 *
 * @param input - JSON string containing repository secrets
 * @returns Array of RepositorySecret objects
 * @throws Error if JSON is invalid
 */
const parseSecrets = (input) => {
    if (!input || input.trim() === '' || input.trim() === '[]') {
        return [];
    }
    try {
        const parsed = JSON.parse(input);
        if (!Array.isArray(parsed)) {
            throw new Error('Repository secrets must be an array');
        }
        return parsed.map((item, index) => {
            if (!item.name || typeof item.name !== 'string') {
                throw new Error(`Secret at index ${index} missing valid name`);
            }
            if (item.value === undefined || typeof item.value !== 'string') {
                throw new Error(`Secret ${item.name} missing valid value`);
            }
            return {
                name: item.name,
                value: item.value,
            };
        });
    }
    catch (error) {
        throw new Error(`Failed to parse repository secrets: ${error instanceof Error ? error.message : String(error)}`);
    }
};
exports.parseSecrets = parseSecrets;
//# sourceMappingURL=inputParser.js.map