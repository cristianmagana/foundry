import { Octokit } from '@octokit/rest';
import { Logger } from 'loglevel';
import { RepositoryInput, RepositoryResult } from '../types/repository';
interface RepositoryService {
    createRepository: (input: RepositoryInput) => Promise<RepositoryResult>;
    createFromTemplate: (input: RepositoryInput) => Promise<RepositoryResult>;
    createNewRepository: (input: RepositoryInput) => Promise<RepositoryResult>;
}
export declare const getRepositoryService: (client: Octokit, log: Logger) => RepositoryService;
export {};
//# sourceMappingURL=repositoryService.d.ts.map