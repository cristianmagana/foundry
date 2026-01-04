/**
 * Unit tests for Repository Service
 * Uses BDD style with proper mocking of Octokit client
 */

import {Logger} from 'loglevel';
import {getRepositoryService} from '../repositoryService';
import {RepositoryInput} from '../../types/repository';

describe('RepositoryService', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockOctokit: any;
    let mockLogger: jest.Mocked<Logger>;
    let repositoryService: ReturnType<typeof getRepositoryService>;

    // Store mock functions for easier access
    let createUsingTemplateMock: jest.Mock;
    let createInOrgMock: jest.Mock;
    let createForAuthenticatedUserMock: jest.Mock;
    let getMock: jest.Mock;
    let renameBranchMock: jest.Mock;

    beforeEach(() => {
        // Create mock functions
        createUsingTemplateMock = jest.fn();
        createInOrgMock = jest.fn();
        createForAuthenticatedUserMock = jest.fn();
        getMock = jest.fn();
        renameBranchMock = jest.fn();

        // Create mock Octokit client
        mockOctokit = {
            repos: {
                createUsingTemplate: createUsingTemplateMock,
                createInOrg: createInOrgMock,
                createForAuthenticatedUser: createForAuthenticatedUserMock,
                get: getMock,
                renameBranch: renameBranchMock,
            },
        };

        // Create mock logger
        mockLogger = {
            info: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        } as unknown as jest.Mocked<Logger>;

        // Initialize service with mocks
        repositoryService = getRepositoryService(mockOctokit, mockLogger);
    });

    describe('createRepository', () => {
        describe('when creating from a template', () => {
            it('should create a repository from a template successfully', async () => {
                // Given: A valid template repository input
                const input: RepositoryInput = {
                    token: 'fake-token',
                    name: 'new-repo',
                    description: 'Test repository',
                    private: false,
                    template: 'owner/template-repo',
                    autoInit: true,
                };

                const mockResponse = {
                    data: {
                        id: 123,
                        full_name: 'owner/new-repo',
                        html_url: 'https://github.com/owner/new-repo',
                        default_branch: 'main',
                    },
                };

                createUsingTemplateMock.mockResolvedValue(mockResponse);

                // When: Creating the repository
                const result = await repositoryService.createRepository(input);

                // Then: Should call the template API with correct parameters
                expect(mockOctokit.repos.createUsingTemplate).toHaveBeenCalledWith({
                    template_owner: 'owner',
                    template_repo: 'template-repo',
                    owner: undefined,
                    name: 'new-repo',
                    description: 'Test repository',
                    private: false,
                    include_all_branches: false,
                    delete_branch_on_merge: true,
                });

                // And: Should return the repository result
                expect(result).toEqual({
                    id: 123,
                    full_name: 'owner/new-repo',
                    html_url: 'https://github.com/owner/new-repo',
                });

                // And: Should log the operation
                expect(mockLogger.info).toHaveBeenCalledWith(
                    'Creating repository from template: owner/template-repo'
                );
            });

            it('should rename branch when custom default branch specified for template', async () => {
                // Given: Template repository with custom default branch
                const input: RepositoryInput = {
                    token: 'fake-token',
                    name: 'template-custom-branch',
                    description: 'Template repo with custom branch',
                    private: false,
                    template: 'owner/template-repo',
                    autoInit: true,
                    defaultBranch: 'develop',
                };

                const mockResponse = {
                    data: {
                        id: 777,
                        full_name: 'owner/template-custom-branch',
                        html_url: 'https://github.com/owner/template-custom-branch',
                        default_branch: 'main', // Template default is 'main'
                    },
                };

                createUsingTemplateMock.mockResolvedValue(mockResponse);
                getMock.mockResolvedValue({
                    data: {default_branch: 'main'},
                });
                renameBranchMock.mockResolvedValue({});

                // When: Creating the repository
                const result = await repositoryService.createRepository(input);

                // Then: Should create from template
                expect(mockOctokit.repos.createUsingTemplate).toHaveBeenCalled();

                // And: Should rename the branch
                expect(mockOctokit.repos.get).toHaveBeenCalledWith({
                    owner: 'owner',
                    repo: 'template-custom-branch',
                });
                expect(mockOctokit.repos.renameBranch).toHaveBeenCalledWith({
                    owner: 'owner',
                    repo: 'template-custom-branch',
                    branch: 'main',
                    new_name: 'develop',
                });

                // And: Should return the repository result
                expect(result).toEqual({
                    id: 777,
                    full_name: 'owner/template-custom-branch',
                    html_url: 'https://github.com/owner/template-custom-branch',
                });
            });

            it('should not rename branch when default branch matches', async () => {
                // Given: Template with matching default branch
                const input: RepositoryInput = {
                    token: 'fake-token',
                    name: 'template-same-branch',
                    description: 'Template with same default branch',
                    private: false,
                    template: 'owner/template-repo',
                    autoInit: true,
                    defaultBranch: 'main',
                };

                const mockResponse = {
                    data: {
                        id: 888,
                        full_name: 'owner/template-same-branch',
                        html_url: 'https://github.com/owner/template-same-branch',
                        default_branch: 'main',
                    },
                };

                createUsingTemplateMock.mockResolvedValue(mockResponse);

                // When: Creating the repository
                await repositoryService.createRepository(input);

                // Then: Should not attempt to rename or update branch
                expect(mockOctokit.repos.get).not.toHaveBeenCalled();
                expect(mockOctokit.repos.renameBranch).not.toHaveBeenCalled();
            });

            it('should throw error when template format is invalid', async () => {
                // Given: An invalid template format
                const input: RepositoryInput = {
                    token: 'fake-token',
                    name: 'new-repo',
                    description: 'Test repository',
                    private: false,
                    template: 'invalid-template', // Missing owner/repo format
                    autoInit: true,
                };

                // When/Then: Should throw error with clear message
                await expect(repositoryService.createRepository(input)).rejects.toThrow(
                    'Invalid template format. Expected format: owner/repository'
                );

                // And: Should not call the API
                expect(mockOctokit.repos.createUsingTemplate).not.toHaveBeenCalled();
            });

            it('should handle API errors gracefully', async () => {
                // Given: A valid input but API fails
                const input: RepositoryInput = {
                    token: 'fake-token',
                    name: 'new-repo',
                    description: 'Test repository',
                    private: false,
                    template: 'owner/template-repo',
                    autoInit: true,
                };

                const apiError = new Error('API rate limit exceeded');
                createUsingTemplateMock.mockRejectedValue(apiError);

                // When/Then: Should throw error with context
                await expect(repositoryService.createRepository(input)).rejects.toThrow(
                    'Failed to create repository from template'
                );
            });
        });

        describe('when creating a new repository', () => {
            describe('for an organization', () => {
                it('should create repository in organization successfully', async () => {
                    // Given: Organization repository input
                    const input: RepositoryInput = {
                        token: 'fake-token',
                        name: 'org-repo',
                        description: 'Organization repository',
                        private: true,
                        organization: 'my-org',
                        autoInit: true,
                        gitignoreTemplate: 'Node',
                        licenseTemplate: 'mit',
                    };

                    const mockResponse = {
                        data: {
                            id: 456,
                            full_name: 'my-org/org-repo',
                            html_url: 'https://github.com/my-org/org-repo',
                        },
                    };

                    createInOrgMock.mockResolvedValue(mockResponse);

                    // When: Creating the repository
                    const result = await repositoryService.createRepository(input);

                    // Then: Should call createInOrg with correct parameters
                    expect(mockOctokit.repos.createInOrg).toHaveBeenCalledWith({
                        org: 'my-org',
                        name: 'org-repo',
                        description: 'Organization repository',
                        private: true,
                        auto_init: true,
                        gitignore_template: 'Node',
                        license_template: 'mit',
                        delete_branch_on_merge: true,
                        allow_squash_merge: true,
                        allow_rebase_merge: true,
                    });

                    // And: Should return the repository result
                    expect(result).toEqual({
                        id: 456,
                        full_name: 'my-org/org-repo',
                        html_url: 'https://github.com/my-org/org-repo',
                    });

                    // And: Should not call the user repo API
                    expect(mockOctokit.repos.createForAuthenticatedUser).not.toHaveBeenCalled();
                });
            });

            describe('for authenticated user', () => {
                it('should create repository for user successfully', async () => {
                    // Given: User repository input (no organization)
                    const input: RepositoryInput = {
                        token: 'fake-token',
                        name: 'user-repo',
                        description: 'Personal repository',
                        private: false,
                        autoInit: true,
                    };

                    const mockResponse = {
                        data: {
                            id: 789,
                            full_name: 'username/user-repo',
                            html_url: 'https://github.com/username/user-repo',
                        },
                    };

                    createForAuthenticatedUserMock.mockResolvedValue(mockResponse);

                    // When: Creating the repository
                    const result = await repositoryService.createRepository(input);

                    // Then: Should call createForAuthenticatedUser
                    expect(mockOctokit.repos.createForAuthenticatedUser).toHaveBeenCalledWith({
                        name: 'user-repo',
                        description: 'Personal repository',
                        private: false,
                        auto_init: true,
                        gitignore_template: undefined,
                        license_template: undefined,
                    });

                    // And: Should return the repository result
                    expect(result).toEqual({
                        id: 789,
                        full_name: 'username/user-repo',
                        html_url: 'https://github.com/username/user-repo',
                    });

                    // And: Should not call the org repo API
                    expect(mockOctokit.repos.createInOrg).not.toHaveBeenCalled();
                });

                it('should handle optional parameters correctly', async () => {
                    // Given: Minimal input without optional fields
                    const input: RepositoryInput = {
                        token: 'fake-token',
                        name: 'minimal-repo',
                        description: '',
                        private: false,
                        autoInit: false,
                    };

                    const mockResponse = {
                        data: {
                            id: 999,
                            full_name: 'username/minimal-repo',
                            html_url: 'https://github.com/username/minimal-repo',
                        },
                    };

                    createForAuthenticatedUserMock.mockResolvedValue(mockResponse);

                    // When: Creating the repository
                    await repositoryService.createRepository(input);

                    // Then: Should pass undefined for empty optional fields
                    expect(mockOctokit.repos.createForAuthenticatedUser).toHaveBeenCalledWith({
                        name: 'minimal-repo',
                        description: '',
                        private: false,
                        auto_init: false,
                        gitignore_template: undefined,
                        license_template: undefined,
                    });
                });
            });

            describe('with custom default branch', () => {
                it('should create repository with custom default branch in org', async () => {
                    // Given: Repository input with custom default branch
                    const input: RepositoryInput = {
                        token: 'fake-token',
                        name: 'custom-branch-repo',
                        description: 'Repository with custom default branch',
                        private: true,
                        organization: 'my-org',
                        autoInit: true,
                        defaultBranch: 'develop',
                    };

                    const mockResponse = {
                        data: {
                            id: 555,
                            full_name: 'my-org/custom-branch-repo',
                            html_url: 'https://github.com/my-org/custom-branch-repo',
                            default_branch: 'master', // GitHub's default
                        },
                    };

                    createInOrgMock.mockResolvedValue(mockResponse);
                    getMock.mockResolvedValue({
                        data: {default_branch: 'master'},
                    });
                    renameBranchMock.mockResolvedValue({});

                    // When: Creating the repository
                    const result = await repositoryService.createRepository(input);

                    // Then: Should create the repository
                    expect(mockOctokit.repos.createInOrg).toHaveBeenCalled();

                    // And: Should rename the branch from master to develop
                    expect(mockOctokit.repos.get).toHaveBeenCalledWith({
                        owner: 'my-org',
                        repo: 'custom-branch-repo',
                    });
                    expect(mockOctokit.repos.renameBranch).toHaveBeenCalledWith({
                        owner: 'my-org',
                        repo: 'custom-branch-repo',
                        branch: 'master',
                        new_name: 'develop',
                    });

                    // And: Should return the repository result
                    expect(result).toEqual({
                        id: 555,
                        full_name: 'my-org/custom-branch-repo',
                        html_url: 'https://github.com/my-org/custom-branch-repo',
                    });
                });

                it('should create repository with custom default branch for user', async () => {
                    // Given: User repository with custom default branch
                    const input: RepositoryInput = {
                        token: 'fake-token',
                        name: 'main-branch-repo',
                        description: 'Repository with main as default',
                        private: false,
                        autoInit: true,
                        defaultBranch: 'main',
                    };

                    const mockResponse = {
                        data: {
                            id: 666,
                            full_name: 'username/main-branch-repo',
                            html_url: 'https://github.com/username/main-branch-repo',
                            default_branch: 'master', // GitHub's default
                        },
                    };

                    createForAuthenticatedUserMock.mockResolvedValue(mockResponse);
                    getMock.mockResolvedValue({
                        data: {default_branch: 'master'},
                    });
                    renameBranchMock.mockResolvedValue({});

                    // When: Creating the repository
                    const result = await repositoryService.createRepository(input);

                    // Then: Should create the repository
                    expect(mockOctokit.repos.createForAuthenticatedUser).toHaveBeenCalled();

                    // And: Should rename the branch from master to main
                    expect(mockOctokit.repos.get).toHaveBeenCalledWith({
                        owner: 'username',
                        repo: 'main-branch-repo',
                    });
                    expect(mockOctokit.repos.renameBranch).toHaveBeenCalledWith({
                        owner: 'username',
                        repo: 'main-branch-repo',
                        branch: 'master',
                        new_name: 'main',
                    });

                    // And: Should return the repository result
                    expect(result).toEqual({
                        id: 666,
                        full_name: 'username/main-branch-repo',
                        html_url: 'https://github.com/username/main-branch-repo',
                    });
                });
            });
        });
    });

    describe('createFromTemplate', () => {
        it('should throw error when template is not provided', async () => {
            // Given: Input without template
            const input: RepositoryInput = {
                token: 'fake-token',
                name: 'new-repo',
                description: 'Test',
                private: false,
                autoInit: true,
            };

            // When/Then: Should throw clear error
            await expect(repositoryService.createFromTemplate(input)).rejects.toThrow(
                'Template repository is required'
            );
        });
    });

    describe('createNewRepository', () => {
        it('should create repository directly', async () => {
            // Given: Standard repository input
            const input: RepositoryInput = {
                token: 'fake-token',
                name: 'direct-repo',
                description: 'Direct creation',
                private: false,
                autoInit: true,
            };

            const mockResponse = {
                data: {
                    id: 111,
                    full_name: 'user/direct-repo',
                    html_url: 'https://github.com/user/direct-repo',
                },
            };

            createForAuthenticatedUserMock.mockResolvedValue(mockResponse);

            // When: Creating new repository directly
            const result = await repositoryService.createNewRepository(input);

            // Then: Should return proper result
            expect(result).toEqual({
                id: 111,
                full_name: 'user/direct-repo',
                html_url: 'https://github.com/user/direct-repo',
            });

            // And: Should log the operation
            expect(mockLogger.info).toHaveBeenCalledWith('Creating new repository');
        });
    });
});
