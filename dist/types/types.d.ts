import { Logger } from 'loglevel';
import { Octokit } from '@octokit/rest';
import { RepositoryInput } from '../api/types/repository';
export type FoundryInitializer = {
    log: Logger;
    octokitClient: Octokit;
    input: RepositoryInput;
};
//# sourceMappingURL=types.d.ts.map