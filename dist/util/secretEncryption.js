"use strict";
/**
 * Secret encryption utilities for GitHub repository secrets
 * Uses libsodium for encryption
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptSecret = void 0;
const libsodium_wrappers_1 = __importDefault(require("libsodium-wrappers"));
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
const encryptSecret = async (publicKey, secretValue) => {
    // Ensure libsodium is ready
    await libsodium_wrappers_1.default.ready;
    // Convert the secret value to Uint8Array
    const messageBytes = libsodium_wrappers_1.default.from_string(secretValue);
    // Decode the base64-encoded public key
    const keyBytes = libsodium_wrappers_1.default.from_base64(publicKey, libsodium_wrappers_1.default.base64_variants.ORIGINAL);
    // Encrypt using libsodium sealed box
    const encryptedBytes = libsodium_wrappers_1.default.crypto_box_seal(messageBytes, keyBytes);
    // Convert to base64 for API transmission
    return libsodium_wrappers_1.default.to_base64(encryptedBytes, libsodium_wrappers_1.default.base64_variants.ORIGINAL);
};
exports.encryptSecret = encryptSecret;
//# sourceMappingURL=secretEncryption.js.map