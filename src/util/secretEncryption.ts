/**
 * Secret encryption utilities for GitHub repository secrets
 * Uses libsodium for encryption
 */

import sodium from 'libsodium-wrappers';

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
export const encryptSecret = async (publicKey: string, secretValue: string): Promise<string> => {
    // Ensure libsodium is ready
    await sodium.ready;

    // Convert the secret value to Uint8Array
    const messageBytes = sodium.from_string(secretValue);

    // Decode the base64-encoded public key
    const keyBytes = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);

    // Encrypt using libsodium sealed box
    const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);

    // Convert to base64 for API transmission
    return sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);
};
