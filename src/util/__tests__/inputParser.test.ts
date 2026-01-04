/**
 * Unit tests for Input Parser utilities
 * Tests JSON parsing and validation logic with BDD style
 */

import {
    parseTeamPermissions,
    parseTopics,
    parseEnvironments,
    parseEnvironmentVariables,
    parseBranchProtectionPreset,
    parseSecrets,
} from '../inputParser';

describe('InputParser', () => {
    describe('parseTeamPermissions', () => {
        describe('when input is valid', () => {
            it('should parse valid team permissions JSON', () => {
                // Given: Valid JSON string
                const input = JSON.stringify([
                    {teamSlug: 'platform-team', permission: 'admin'},
                    {teamSlug: 'dev-team', permission: 'push'},
                ]);

                // When: Parsing the input
                const result = parseTeamPermissions(input);

                // Then: Should return parsed team permissions
                expect(result).toEqual([
                    {teamSlug: 'platform-team', permission: 'admin'},
                    {teamSlug: 'dev-team', permission: 'push'},
                ]);
            });

            it('should accept all valid permission levels', () => {
                // Given: All valid permission types
                const permissions = ['pull', 'triage', 'push', 'maintain', 'admin'];
                const input = JSON.stringify(
                    permissions.map((p, i) => ({teamSlug: `team-${i}`, permission: p}))
                );

                // When: Parsing the input
                const result = parseTeamPermissions(input);

                // Then: Should parse all permissions successfully
                expect(result).toHaveLength(5);
                expect(result.map(r => r.permission)).toEqual(permissions);
            });
        });

        describe('when input is empty', () => {
            it('should return empty array for empty string', () => {
                expect(parseTeamPermissions('')).toEqual([]);
            });

            it('should return empty array for whitespace', () => {
                expect(parseTeamPermissions('  ')).toEqual([]);
            });

            it('should return empty array for empty JSON array', () => {
                expect(parseTeamPermissions('[]')).toEqual([]);
            });
        });

        describe('when input is invalid', () => {
            it('should throw error for invalid JSON', () => {
                // Given: Malformed JSON
                const input = '{invalid json}';

                // When/Then: Should throw with helpful message
                expect(() => parseTeamPermissions(input)).toThrow(
                    'Failed to parse team permissions'
                );
            });

            it('should throw error when input is not an array', () => {
                // Given: Valid JSON but not an array
                const input = JSON.stringify({teamSlug: 'team', permission: 'admin'});

                // When/Then: Should throw clear error
                expect(() => parseTeamPermissions(input)).toThrow(
                    'Team permissions must be an array'
                );
            });

            it('should throw error for missing teamSlug', () => {
                // Given: Missing teamSlug field
                const input = JSON.stringify([{permission: 'admin'}]);

                // When/Then: Should indicate which index is invalid
                expect(() => parseTeamPermissions(input)).toThrow(
                    'Team permission at index 0 missing valid teamSlug'
                );
            });

            it('should throw error for missing permission', () => {
                // Given: Missing permission field
                const input = JSON.stringify([{teamSlug: 'team'}]);

                // When/Then: Should indicate which index is invalid
                expect(() => parseTeamPermissions(input)).toThrow(
                    'Team permission at index 0 missing valid permission'
                );
            });

            it('should throw error for invalid permission value', () => {
                // Given: Invalid permission value
                const input = JSON.stringify([{teamSlug: 'team', permission: 'invalid'}]);

                // When/Then: Should list valid options
                expect(() => parseTeamPermissions(input)).toThrow(
                    'has invalid permission: invalid. Must be one of: pull, triage, push, maintain, admin'
                );
            });
        });
    });

    describe('parseTopics', () => {
        describe('when input is comma-separated', () => {
            it('should parse comma-separated topics', () => {
                // Given: Comma-separated string
                const input = 'nodejs,typescript,github-actions';

                // When: Parsing
                const result = parseTopics(input);

                // Then: Should return array of topics
                expect(result).toEqual(['nodejs', 'typescript', 'github-actions']);
            });

            it('should trim whitespace from topics', () => {
                // Given: Topics with extra whitespace
                const input = '  nodejs  ,  typescript  ,  github-actions  ';

                // When: Parsing
                const result = parseTopics(input);

                // Then: Should trim whitespace
                expect(result).toEqual(['nodejs', 'typescript', 'github-actions']);
            });

            it('should filter out empty topics', () => {
                // Given: Input with empty entries
                const input = 'nodejs,,typescript,,,github-actions';

                // When: Parsing
                const result = parseTopics(input);

                // Then: Should exclude empty strings
                expect(result).toEqual(['nodejs', 'typescript', 'github-actions']);
            });
        });

        describe('when input is JSON array', () => {
            it('should parse JSON array of topics', () => {
                // Given: JSON array format
                const input = JSON.stringify(['nodejs', 'typescript', 'github-actions']);

                // When: Parsing
                const result = parseTopics(input);

                // Then: Should return parsed array
                expect(result).toEqual(['nodejs', 'typescript', 'github-actions']);
            });

            it('should filter non-string values from JSON array', () => {
                // Given: JSON array with mixed types
                const input = JSON.stringify(['nodejs', 123, 'typescript', null, 'actions']);

                // When: Parsing
                const result = parseTopics(input);

                // Then: Should only include strings
                expect(result).toEqual(['nodejs', 'typescript', 'actions']);
            });
        });

        describe('when input is empty', () => {
            it('should return empty array for empty string', () => {
                expect(parseTopics('')).toEqual([]);
            });

            it('should return empty array for whitespace', () => {
                expect(parseTopics('   ')).toEqual([]);
            });
        });
    });

    describe('parseEnvironments', () => {
        describe('when input is valid', () => {
            it('should parse environment with all fields', () => {
                // Given: Complete environment configuration
                const input = JSON.stringify([
                    {
                        name: 'production',
                        waitTimer: 30,
                        reviewers: [
                            {type: 'Team', slug: 'admins'},
                            {type: 'User', slug: 'john-doe'},
                        ],
                        preventSelfReview: true,
                    },
                ]);

                // When: Parsing
                const result = parseEnvironments(input);

                // Then: Should parse all fields correctly
                expect(result).toEqual([
                    {
                        name: 'production',
                        waitTimer: 30,
                        reviewers: [
                            {type: 'Team', slug: 'admins'},
                            {type: 'User', slug: 'john-doe'},
                        ],
                        preventSelfReview: true,
                    },
                ]);
            });

            it('should parse environment with minimal fields', () => {
                // Given: Just environment name
                const input = JSON.stringify([{name: 'staging'}]);

                // When: Parsing
                const result = parseEnvironments(input);

                // Then: Should only include name
                expect(result).toEqual([{name: 'staging'}]);
            });

            it('should handle multiple environments', () => {
                // Given: Multiple environments
                const input = JSON.stringify([
                    {name: 'production'},
                    {name: 'staging'},
                    {name: 'development'},
                ]);

                // When: Parsing
                const result = parseEnvironments(input);

                // Then: Should parse all environments
                expect(result).toHaveLength(3);
                expect(result.map(e => e.name)).toEqual(['production', 'staging', 'development']);
            });
        });

        describe('when input is invalid', () => {
            it('should throw error for missing name', () => {
                // Given: Environment without name
                const input = JSON.stringify([{waitTimer: 30}]);

                // When/Then: Should throw descriptive error
                expect(() => parseEnvironments(input)).toThrow(
                    'Environment at index 0 missing valid name'
                );
            });

            it('should throw error for invalid waitTimer', () => {
                // Given: Negative wait timer
                const input = JSON.stringify([{name: 'prod', waitTimer: -5}]);

                // When/Then: Should validate wait timer
                expect(() => parseEnvironments(input)).toThrow(
                    'Environment prod has invalid waitTimer (must be a non-negative number)'
                );
            });

            it('should throw error for invalid reviewer type', () => {
                // Given: Invalid reviewer type
                const input = JSON.stringify([
                    {
                        name: 'prod',
                        reviewers: [{type: 'Invalid', slug: 'test'}],
                    },
                ]);

                // When/Then: Should validate reviewer type
                expect(() => parseEnvironments(input)).toThrow(
                    "has invalid type (must be 'User' or 'Team')"
                );
            });
        });
    });

    describe('parseEnvironmentVariables', () => {
        describe('when input is valid', () => {
            it('should parse environment variables correctly', () => {
                // Given: Valid environment variables
                const input = JSON.stringify([
                    {
                        environmentName: 'production',
                        variables: [
                            {name: 'NODE_ENV', value: 'production'},
                            {name: 'LOG_LEVEL', value: 'error'},
                        ],
                    },
                ]);

                // When: Parsing
                const result = parseEnvironmentVariables(input);

                // Then: Should parse variables structure
                expect(result).toEqual([
                    {
                        environmentName: 'production',
                        variables: [
                            {name: 'NODE_ENV', value: 'production'},
                            {name: 'LOG_LEVEL', value: 'error'},
                        ],
                    },
                ]);
            });

            it('should handle multiple environments with variables', () => {
                // Given: Multiple environments
                const input = JSON.stringify([
                    {
                        environmentName: 'production',
                        variables: [{name: 'ENV', value: 'prod'}],
                    },
                    {
                        environmentName: 'staging',
                        variables: [{name: 'ENV', value: 'stage'}],
                    },
                ]);

                // When: Parsing
                const result = parseEnvironmentVariables(input);

                // Then: Should parse all environments
                expect(result).toHaveLength(2);
            });
        });

        describe('when input is invalid', () => {
            it('should throw error for missing environmentName', () => {
                // Given: Missing environment name
                const input = JSON.stringify([{variables: []}]);

                // When/Then: Should throw error
                expect(() => parseEnvironmentVariables(input)).toThrow(
                    'Environment variables at index 0 missing valid environmentName'
                );
            });

            it('should throw error for missing variables array', () => {
                // Given: Missing variables
                const input = JSON.stringify([{environmentName: 'prod'}]);

                // When/Then: Should require variables array
                expect(() => parseEnvironmentVariables(input)).toThrow(
                    'Environment variables for prod must contain a variables array'
                );
            });
        });
    });

    describe('parseBranchProtectionPreset', () => {
        describe('when input is valid', () => {
            it('should parse valid presets', () => {
                expect(parseBranchProtectionPreset('strict')).toBe('strict');
                expect(parseBranchProtectionPreset('moderate')).toBe('moderate');
                expect(parseBranchProtectionPreset('minimal')).toBe('minimal');
            });

            it('should trim whitespace', () => {
                expect(parseBranchProtectionPreset('  strict  ')).toBe('strict');
            });
        });

        describe('when input is empty', () => {
            it('should return undefined for empty string', () => {
                expect(parseBranchProtectionPreset('')).toBeUndefined();
            });

            it('should return undefined for whitespace', () => {
                expect(parseBranchProtectionPreset('  ')).toBeUndefined();
            });
        });

        describe('when input is invalid', () => {
            it('should throw error for invalid preset', () => {
                // Given: Invalid preset name
                const input = 'invalid-preset';

                // When/Then: Should list valid options
                expect(() => parseBranchProtectionPreset(input)).toThrow(
                    'Invalid branch protection preset: invalid-preset. Must be one of: strict, moderate, minimal'
                );
            });
        });
    });

    describe('parseSecrets', () => {
        describe('when input is valid', () => {
            it('should parse secrets correctly', () => {
                // Given: Valid secrets
                const input = JSON.stringify([
                    {name: 'API_KEY', value: 'secret123'},
                    {name: 'DATABASE_URL', value: 'postgres://...'},
                ]);

                // When: Parsing
                const result = parseSecrets(input);

                // Then: Should parse secrets
                expect(result).toEqual([
                    {name: 'API_KEY', value: 'secret123'},
                    {name: 'DATABASE_URL', value: 'postgres://...'},
                ]);
            });
        });

        describe('when input is invalid', () => {
            it('should throw error for missing name', () => {
                // Given: Secret without name
                const input = JSON.stringify([{value: 'secret'}]);

                // When/Then: Should require name
                expect(() => parseSecrets(input)).toThrow('Secret at index 0 missing valid name');
            });

            it('should throw error for missing value', () => {
                // Given: Secret without value
                const input = JSON.stringify([{name: 'API_KEY'}]);

                // When/Then: Should require value
                expect(() => parseSecrets(input)).toThrow('Secret API_KEY missing valid value');
            });
        });
    });
});
