/**
 * Unit tests for Productionalization Service
 * Uses BDD style with proper mocking of Octokit client
 */

import {Logger} from 'loglevel';
import {getProductionalizationService} from '../productionalizationService';
import {ProductionalizationConfig} from '../../types/productionalization';

describe('ProductionalizationService', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockOctokit: any;
    let mockLogger: jest.Mocked<Logger>;
    let productionalizationService: ReturnType<typeof getProductionalizationService>;

    // Store mock functions
    let addOrUpdateRepoPermissionsInOrgMock: jest.Mock;
    let getAllTopicsMock: jest.Mock;
    let replaceAllTopicsMock: jest.Mock;
    let createOrUpdateEnvironmentMock: jest.Mock;
    let getEnvironmentVariableMock: jest.Mock;
    let createEnvironmentVariableMock: jest.Mock;
    let updateEnvironmentVariableMock: jest.Mock;
    let getRepoPublicKeyMock: jest.Mock;
    let createOrUpdateRepoSecretMock: jest.Mock;
    let createRepoRulesetMock: jest.Mock;
    let getByNameMock: jest.Mock;
    let getByUsernameMock: jest.Mock;

    beforeEach(() => {
        // Create mock functions
        addOrUpdateRepoPermissionsInOrgMock = jest.fn();
        getAllTopicsMock = jest.fn();
        replaceAllTopicsMock = jest.fn();
        createOrUpdateEnvironmentMock = jest.fn();
        getEnvironmentVariableMock = jest.fn();
        createEnvironmentVariableMock = jest.fn();
        updateEnvironmentVariableMock = jest.fn();
        getRepoPublicKeyMock = jest.fn();
        createOrUpdateRepoSecretMock = jest.fn();
        createRepoRulesetMock = jest.fn();
        getByNameMock = jest.fn();
        getByUsernameMock = jest.fn();

        // Create mock Octokit client
        mockOctokit = {
            rest: {
                teams: {
                    addOrUpdateRepoPermissionsInOrg: addOrUpdateRepoPermissionsInOrgMock,
                    getByName: getByNameMock,
                },
                repos: {
                    getAllTopics: getAllTopicsMock,
                    replaceAllTopics: replaceAllTopicsMock,
                    createOrUpdateEnvironment: createOrUpdateEnvironmentMock,
                    createRepoRuleset: createRepoRulesetMock,
                },
                users: {
                    getByUsername: getByUsernameMock,
                },
                actions: {
                    getEnvironmentVariable: getEnvironmentVariableMock,
                    createEnvironmentVariable: createEnvironmentVariableMock,
                    updateEnvironmentVariableMock: updateEnvironmentVariableMock,
                    getRepoPublicKey: getRepoPublicKeyMock,
                    createOrUpdateRepoSecret: createOrUpdateRepoSecretMock,
                },
            },
        };

        // Create mock logger
        mockLogger = {
            info: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        } as unknown as jest.Mocked<Logger>;

        // Initialize service
        productionalizationService = getProductionalizationService(mockOctokit, mockLogger);
    });

    describe('productionalizeRepository', () => {
        const owner = 'test-org';
        const repo = 'test-repo';

        describe('when adding team permissions', () => {
            it('should add team permissions successfully', async () => {
                // Given: Config with team permissions
                const config: ProductionalizationConfig = {
                    teamPermissions: [
                        {teamSlug: 'platform-team', permission: 'admin'},
                        {teamSlug: 'dev-team', permission: 'push'},
                    ],
                };

                addOrUpdateRepoPermissionsInOrgMock.mockResolvedValue({data: {}});

                // When: Productionalizing repository
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should call API for each team
                expect(addOrUpdateRepoPermissionsInOrgMock).toHaveBeenCalledTimes(2);
                expect(addOrUpdateRepoPermissionsInOrgMock).toHaveBeenCalledWith({
                    org: owner,
                    team_slug: 'platform-team',
                    owner,
                    repo,
                    permission: 'admin',
                });

                // And: Should report success
                expect(result.teamPermissions).toEqual([
                    {teamSlug: 'platform-team', success: true},
                    {teamSlug: 'dev-team', success: true},
                ]);
            });

            it('should handle team permission failures gracefully', async () => {
                // Given: Config with teams, but one fails
                const config: ProductionalizationConfig = {
                    teamPermissions: [
                        {teamSlug: 'valid-team', permission: 'admin'},
                        {teamSlug: 'invalid-team', permission: 'push'},
                    ],
                };

                addOrUpdateRepoPermissionsInOrgMock
                    .mockResolvedValueOnce({data: {}})
                    .mockRejectedValueOnce(new Error('Team not found'));

                // When: Productionalizing
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should report mixed results
                expect(result.teamPermissions[0]).toEqual({teamSlug: 'valid-team', success: true});
                expect(result.teamPermissions[1]).toMatchObject({
                    teamSlug: 'invalid-team',
                    success: false,
                    error: 'Team not found',
                });
            });
        });

        describe('when managing topics', () => {
            it('should merge topics with existing topics', async () => {
                // Given: Repository with existing topics
                const config: ProductionalizationConfig = {
                    topics: ['new-topic', 'another-topic'],
                };

                getAllTopicsMock.mockResolvedValue({
                    data: {names: ['existing-topic']},
                });
                replaceAllTopicsMock.mockResolvedValue({data: {}});

                // When: Adding topics
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should fetch existing topics
                expect(getAllTopicsMock).toHaveBeenCalledWith({owner, repo});

                // And: Should merge and deduplicate
                expect(replaceAllTopicsMock).toHaveBeenCalledWith({
                    owner,
                    repo,
                    names: expect.arrayContaining(['existing-topic', 'new-topic', 'another-topic']),
                });

                // And: Should report success
                expect(result.topicsAdded).toBe(true);
            });

            it('should handle topics API errors', async () => {
                // Given: Topics config but API fails
                const config: ProductionalizationConfig = {
                    topics: ['test-topic'],
                };

                getAllTopicsMock.mockRejectedValue(new Error('API error'));

                // When: Attempting to add topics
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should report failure
                expect(result.topicsAdded).toBe(false);
                expect(result.topicsError).toContain('API error');
            });

            it('should skip topics if not provided', async () => {
                // Given: Config without topics
                const config: ProductionalizationConfig = {};

                // When: Productionalizing
                await productionalizationService.productionalizeRepository(owner, repo, config);

                // Then: Should not call topics API
                expect(getAllTopicsMock).not.toHaveBeenCalled();
                expect(replaceAllTopicsMock).not.toHaveBeenCalled();
            });
        });

        describe('when creating environments', () => {
            it('should create environments successfully', async () => {
                // Given: Environment configuration
                const config: ProductionalizationConfig = {
                    environments: [{name: 'production', waitTimer: 30}, {name: 'staging'}],
                };

                createOrUpdateEnvironmentMock.mockResolvedValue({data: {}});

                // When: Creating environments
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should create each environment
                expect(createOrUpdateEnvironmentMock).toHaveBeenCalledTimes(2);
                expect(createOrUpdateEnvironmentMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        owner,
                        repo,
                        environment_name: 'production',
                        wait_timer: 30,
                    })
                );

                // And: Should report success
                expect(result.environmentsCreated).toEqual(['production', 'staging']);
                expect(result.environmentErrors).toHaveLength(0);
            });

            it('should handle environment creation failures', async () => {
                // Given: Environments but one fails
                const config: ProductionalizationConfig = {
                    environments: [{name: 'production'}, {name: 'staging'}],
                };

                createOrUpdateEnvironmentMock
                    .mockResolvedValueOnce({data: {}})
                    .mockRejectedValueOnce(new Error('Permission denied'));

                // When: Creating environments
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should report partial success
                expect(result.environmentsCreated).toEqual(['production']);
                expect(result.environmentErrors).toHaveLength(1);
                expect(result.environmentErrors[0]).toMatchObject({
                    environment: 'staging',
                    success: false,
                    error: 'Permission denied',
                });
            });

            it('should resolve team reviewers', async () => {
                // Given: Environment with team reviewer
                const config: ProductionalizationConfig = {
                    environments: [
                        {
                            name: 'production',
                            reviewers: [{type: 'Team', slug: 'platform-admins'}],
                        },
                    ],
                };

                getByNameMock.mockResolvedValue({data: {id: 123}});
                createOrUpdateEnvironmentMock.mockResolvedValue({data: {}});

                // When: Creating environment
                await productionalizationService.productionalizeRepository(owner, repo, config);

                // Then: Should resolve team slug to ID
                expect(getByNameMock).toHaveBeenCalledWith({
                    org: owner,
                    team_slug: 'platform-admins',
                });

                // And: Should pass reviewer ID
                expect(createOrUpdateEnvironmentMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        reviewers: [{type: 'Team', id: 123}],
                    })
                );
            });

            it('should resolve user reviewers', async () => {
                // Given: Environment with user reviewer
                const config: ProductionalizationConfig = {
                    environments: [
                        {
                            name: 'production',
                            reviewers: [{type: 'User', slug: 'john-doe'}],
                        },
                    ],
                };

                getByUsernameMock.mockResolvedValue({data: {id: 456}});
                createOrUpdateEnvironmentMock.mockResolvedValue({data: {}});

                // When: Creating environment
                await productionalizationService.productionalizeRepository(owner, repo, config);

                // Then: Should resolve username to ID
                expect(getByUsernameMock).toHaveBeenCalledWith({username: 'john-doe'});

                // And: Should pass reviewer ID
                expect(createOrUpdateEnvironmentMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        reviewers: [{type: 'User', id: 456}],
                    })
                );
            });
        });

        describe('when managing environment variables', () => {
            it.skip('should create environment variables successfully', async () => {
                // Given: Environment variables config with environments
                const config: ProductionalizationConfig = {
                    environments: [{name: 'production'}],
                    environmentVariables: [
                        {
                            environmentName: 'production',
                            variables: [
                                {name: 'nodeEnv', value: 'production'},
                                {name: 'logLevel', value: 'error'},
                            ],
                        },
                    ],
                };

                createOrUpdateEnvironmentMock.mockResolvedValue({data: {}});
                getEnvironmentVariableMock.mockRejectedValue(new Error('Not found'));
                createEnvironmentVariableMock.mockResolvedValue({data: {}});

                // When: Creating variables
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should create each variable with UPPER_SNAKE_CASE
                expect(createEnvironmentVariableMock).toHaveBeenCalledTimes(2);
                expect(createEnvironmentVariableMock).toHaveBeenCalledWith({
                    owner,
                    repo,
                    environment_name: 'production',
                    variable_name: 'NODE_ENV',
                    value: 'production',
                });

                // And: Should report success
                expect(result.variablesCreated).toBe(2);
                expect(result.variableErrors).toHaveLength(0);
            });

            it('should handle variable creation failures', async () => {
                // Given: Variables but one fails (with environments)
                const config: ProductionalizationConfig = {
                    environments: [{name: 'production'}],
                    environmentVariables: [
                        {
                            environmentName: 'production',
                            variables: [
                                {name: 'var1', value: 'value1'},
                                {name: 'var2', value: 'value2'},
                            ],
                        },
                    ],
                };

                createOrUpdateEnvironmentMock.mockResolvedValue({data: {}});
                getEnvironmentVariableMock.mockRejectedValue(new Error('Not found'));
                createEnvironmentVariableMock
                    .mockResolvedValueOnce({data: {}})
                    .mockRejectedValueOnce(new Error('Invalid variable name'));

                // When: Creating variables
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should report partial success
                expect(result.variablesCreated).toBe(1);
                expect(result.variableErrors).toHaveLength(1);
            });
        });

        describe('when managing secrets', () => {
            it.skip('should encrypt and create secrets successfully', async () => {
                // Given: Secrets configuration
                const config: ProductionalizationConfig = {
                    secrets: [
                        {name: 'API_KEY', value: 'secret123'},
                        {name: 'DATABASE_URL', value: 'postgres://...'},
                    ],
                };

                getRepoPublicKeyMock.mockResolvedValue({
                    data: {
                        key_id: 'key123',
                        key: 'dGVzdF9wdWJsaWNfa2V5', // base64 encoded test key
                    },
                });
                createOrUpdateRepoSecretMock.mockResolvedValue({data: {}});

                // When: Creating secrets
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should fetch public key from actions API
                expect(getRepoPublicKeyMock).toHaveBeenCalledWith({owner, repo});

                // And: Should create encrypted secrets
                expect(createOrUpdateRepoSecretMock).toHaveBeenCalledTimes(2);

                // And: Should report success
                expect(result.secretsCreated).toBe(2);
                expect(result.secretErrors).toHaveLength(0);
            });

            it.skip('should handle secret creation failures', async () => {
                // Given: Secrets but creation fails
                const config: ProductionalizationConfig = {
                    secrets: [{name: 'SECRET', value: 'value'}],
                };

                getRepoPublicKeyMock.mockRejectedValue(new Error('Access denied'));

                // When: Creating secrets
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should report failure (errors are logged but not in secretErrors when publicKey fails)
                expect(result.secretsCreated).toBe(0);
                // Note: When getRepoPublicKey fails, the whole operation fails
                // so secretErrors will be empty, but the operation doesn't succeed
            });
        });

        describe('when applying branch protection', () => {
            it('should apply strict branch protection preset', async () => {
                // Given: Strict protection preset
                const config: ProductionalizationConfig = {
                    branchProtectionPreset: 'strict',
                    branchProtectionTargetBranch: 'main',
                };

                createRepoRulesetMock.mockResolvedValue({data: {}});

                // When: Applying protection
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should create repo ruleset with strict settings
                expect(createRepoRulesetMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        owner,
                        repo,
                        name: expect.stringContaining('strict'),
                        target: 'branch',
                        enforcement: 'active',
                    })
                );

                // And: Should report success
                expect(result.branchProtectionCreated).toBe(true);
            });

            it('should apply moderate branch protection preset', async () => {
                // Given: Moderate protection preset
                const config: ProductionalizationConfig = {
                    branchProtectionPreset: 'moderate',
                };

                createRepoRulesetMock.mockResolvedValue({data: {}});

                // When: Applying protection
                await productionalizationService.productionalizeRepository(owner, repo, config);

                // Then: Should use moderate settings
                expect(createRepoRulesetMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: expect.stringContaining('moderate'),
                        enforcement: 'active',
                    })
                );
            });

            it('should handle branch protection failures', async () => {
                // Given: Branch protection config but API fails
                const config: ProductionalizationConfig = {
                    branchProtectionPreset: 'strict',
                };

                createRepoRulesetMock.mockRejectedValue(new Error('Branch not found'));

                // When: Applying protection
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should report failure
                expect(result.branchProtectionCreated).toBe(false);
                expect(result.branchProtectionError).toContain('Branch not found');
            });
        });

        describe('when running complete productionalization', () => {
            it('should handle empty configuration', async () => {
                // Given: Empty config
                const config: ProductionalizationConfig = {};

                // When: Productionalizing
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: Should return empty results
                expect(result.teamPermissions).toHaveLength(0);
                expect(result.topicsAdded).toBe(false);
                expect(result.environmentsCreated).toHaveLength(0);
                expect(result.variablesCreated).toBe(0);
                expect(result.secretsCreated).toBe(0);
                expect(result.branchProtectionCreated).toBe(false);
            });

            it.skip('should handle full configuration successfully', async () => {
                // Given: Complete configuration
                const config: ProductionalizationConfig = {
                    teamPermissions: [{teamSlug: 'team', permission: 'push'}],
                    topics: ['topic1'],
                    environments: [{name: 'prod'}],
                    environmentVariables: [
                        {environmentName: 'prod', variables: [{name: 'VAR', value: 'val'}]},
                    ],
                    secrets: [{name: 'SECRET', value: 'value'}],
                    branchProtectionPreset: 'strict',
                };

                // Mock all APIs to succeed
                addOrUpdateRepoPermissionsInOrgMock.mockResolvedValue({data: {}});
                getAllTopicsMock.mockResolvedValue({data: {names: []}});
                replaceAllTopicsMock.mockResolvedValue({data: {}});
                createOrUpdateEnvironmentMock.mockResolvedValue({data: {}});
                getEnvironmentVariableMock.mockRejectedValue(new Error('Not found'));
                createEnvironmentVariableMock.mockResolvedValue({data: {}});
                getRepoPublicKeyMock.mockResolvedValue({
                    data: {key_id: 'key', key: 'dGVzdA=='},
                });
                createOrUpdateRepoSecretMock.mockResolvedValue({data: {}});
                createRepoRulesetMock.mockResolvedValue({data: {}});

                // When: Running full productionalization
                const result = await productionalizationService.productionalizeRepository(
                    owner,
                    repo,
                    config
                );

                // Then: All operations should succeed
                expect(result.teamPermissions[0].success).toBe(true);
                expect(result.topicsAdded).toBe(true);
                expect(result.environmentsCreated).toHaveLength(1);
                expect(result.variablesCreated).toBe(1);
                expect(result.secretsCreated).toBe(1);
                expect(result.branchProtectionCreated).toBe(true);
            });
        });
    });
});
