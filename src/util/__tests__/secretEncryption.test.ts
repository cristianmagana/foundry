/**
 * Unit tests for Secret Encryption utilities
 */

import {encryptSecret} from '../secretEncryption';
import sodium from 'libsodium-wrappers';

describe('SecretEncryption', () => {
    beforeAll(async () => {
        // Ensure libsodium is ready before tests
        await sodium.ready;
    });

    describe('encryptSecret', () => {
        describe('when encrypting a secret', () => {
            it('should encrypt secret with public key', async () => {
                // Given: A public key and secret value
                const keyPair = sodium.crypto_box_keypair();
                const publicKey = sodium.to_base64(
                    keyPair.publicKey,
                    sodium.base64_variants.ORIGINAL
                );
                const secretValue = 'my-secret-value';

                // When: Encrypting the secret
                const encrypted = await encryptSecret(publicKey, secretValue);

                // Then: Should return base64-encoded encrypted value
                expect(encrypted).toBeDefined();
                expect(typeof encrypted).toBe('string');
                expect(encrypted.length).toBeGreaterThan(0);

                // Encrypted value should be different from original
                expect(encrypted).not.toBe(secretValue);

                // Should be valid base64
                expect(() =>
                    sodium.from_base64(encrypted, sodium.base64_variants.ORIGINAL)
                ).not.toThrow();
            });

            it('should produce different encrypted values for same input', async () => {
                // Given: Same public key and secret
                const keyPair = sodium.crypto_box_keypair();
                const publicKey = sodium.to_base64(
                    keyPair.publicKey,
                    sodium.base64_variants.ORIGINAL
                );
                const secretValue = 'test-secret';

                // When: Encrypting same secret twice
                const encrypted1 = await encryptSecret(publicKey, secretValue);
                const encrypted2 = await encryptSecret(publicKey, secretValue);

                // Then: Should produce different encrypted values (nonce randomization)
                expect(encrypted1).not.toBe(encrypted2);
            });

            it('should handle empty secret', async () => {
                // Given: Empty secret value
                const keyPair = sodium.crypto_box_keypair();
                const publicKey = sodium.to_base64(
                    keyPair.publicKey,
                    sodium.base64_variants.ORIGINAL
                );
                const secretValue = '';

                // When: Encrypting empty secret
                const encrypted = await encryptSecret(publicKey, secretValue);

                // Then: Should still encrypt successfully
                expect(encrypted).toBeDefined();
                expect(typeof encrypted).toBe('string');
            });

            it('should handle long secret values', async () => {
                // Given: Long secret value
                const keyPair = sodium.crypto_box_keypair();
                const publicKey = sodium.to_base64(
                    keyPair.publicKey,
                    sodium.base64_variants.ORIGINAL
                );
                const secretValue = 'x'.repeat(1000);

                // When: Encrypting long secret
                const encrypted = await encryptSecret(publicKey, secretValue);

                // Then: Should encrypt successfully
                expect(encrypted).toBeDefined();
                expect(typeof encrypted).toBe('string');
            });

            it('should handle special characters in secret', async () => {
                // Given: Secret with special characters
                const keyPair = sodium.crypto_box_keypair();
                const publicKey = sodium.to_base64(
                    keyPair.publicKey,
                    sodium.base64_variants.ORIGINAL
                );
                const secretValue = 'secret!@#$%^&*(){}[]|\\:;"<>?,./~`';

                // When: Encrypting
                const encrypted = await encryptSecret(publicKey, secretValue);

                // Then: Should encrypt successfully
                expect(encrypted).toBeDefined();
                expect(typeof encrypted).toBe('string');
            });

            it('should handle unicode characters', async () => {
                // Given: Secret with unicode
                const keyPair = sodium.crypto_box_keypair();
                const publicKey = sodium.to_base64(
                    keyPair.publicKey,
                    sodium.base64_variants.ORIGINAL
                );
                const secretValue = 'Hello 世界 🌍';

                // When: Encrypting
                const encrypted = await encryptSecret(publicKey, secretValue);

                // Then: Should encrypt successfully
                expect(encrypted).toBeDefined();
                expect(typeof encrypted).toBe('string');
            });
        });

        describe('when decrypting (verification)', () => {
            it('should be decryptable with private key', async () => {
                // Given: Key pair and secret
                const keyPair = sodium.crypto_box_keypair();
                const publicKey = sodium.to_base64(
                    keyPair.publicKey,
                    sodium.base64_variants.ORIGINAL
                );
                const secretValue = 'test-secret-123';

                // When: Encrypting then decrypting
                const encrypted = await encryptSecret(publicKey, secretValue);
                const encryptedBytes = sodium.from_base64(
                    encrypted,
                    sodium.base64_variants.ORIGINAL
                );
                const decryptedBytes = sodium.crypto_box_seal_open(
                    encryptedBytes,
                    keyPair.publicKey,
                    keyPair.privateKey
                );
                const decrypted = sodium.to_string(decryptedBytes);

                // Then: Should decrypt to original value
                expect(decrypted).toBe(secretValue);
            });
        });
    });
});
