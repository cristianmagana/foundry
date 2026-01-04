/**
 * Unit tests for Config utilities
 */

import {getOctokitClient} from '../config';
import {Octokit} from '@octokit/rest';

describe('Config', () => {
    describe('getOctokitClient', () => {
        describe('when creating Octokit client', () => {
            it('should create client with authentication token', () => {
                // Given: Valid authentication token
                const token = 'ghp_test_token_123';

                // When: Creating Octokit client
                const client = getOctokitClient(token);

                // Then: Should return Octokit instance
                expect(client).toBeDefined();
                expect(client).toBeInstanceOf(Octokit);
            });

            it('should create client with different tokens', () => {
                // Given: Different tokens
                const token1 = 'ghp_token_1';
                const token2 = 'ghp_token_2';

                // When: Creating multiple clients
                const client1 = getOctokitClient(token1);
                const client2 = getOctokitClient(token2);

                // Then: Both should be valid Octokit instances
                expect(client1).toBeInstanceOf(Octokit);
                expect(client2).toBeInstanceOf(Octokit);
                expect(client1).not.toBe(client2);
            });

            it('should handle empty token', () => {
                // Given: Empty token
                const token = '';

                // When: Creating client
                const client = getOctokitClient(token);

                // Then: Should still create client (auth will fail later)
                expect(client).toBeInstanceOf(Octokit);
            });
        });
    });
});
