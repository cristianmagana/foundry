/**
 * Secret encryption utilities for GitHub repository secrets
 * Uses libsodium for encryption
 */
/**
 * Encrypts a secret value using a repository's public key
 *
 * GitHub requires secrets to be encrypted using libsodium sealed boxes
 * before they can be uploaded via the API.
 *
 * @param publicKey - Base64-encoded repository public key from GitHub API
 * @param secretValue - The plaintext secret value to encrypt
 * @returns Base64-encoded encrypted secret value
 *
 * @see https://docs.github.com/en/rest/actions/secrets#create-or-update-a-repository-secret
 */
export declare const encryptSecret: (publicKey: string, secretValue: string) => Promise<string>;
//# sourceMappingURL=secretEncryption.d.ts.map