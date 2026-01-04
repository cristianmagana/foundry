import {Octokit} from '@octokit/rest';

export const getOctokitClient = (auth: string): Octokit => {
    return new Octokit({auth});
};
