import crypto from 'node:crypto';

export class AesEncryptionHelper {
	// The following implementation is inspired by this article:
	// https://medium.com/@tony.infisical/guide-to-nodes-crypto-module-for-encryption-decryption-65c077176980

	private static readonly algorithm = 'aes-256-gcm';
	private static readonly saltLength = 16;
	private static readonly keyLength = 32;
	private static readonly ivLength = 16;
	private static readonly authTagLength = 16;
	private static readonly cipherTextEncoding = 'base64';
	private static readonly plainTextEncoding = 'utf8';
	private static readonly pbkdf2Iterations = 100000;
	private static readonly pbkdf2Digest = 'sha256';

	public static encrypt(plainText: string, secret: string): string {
		const salt = crypto.randomBytes(this.saltLength);

		const { key, iv } = this.deriveKeyAndIv(secret, salt);

		const cipher = crypto.createCipheriv(this.algorithm, key, iv);
		const cipherText = Buffer.concat([salt, cipher.update(plainText), cipher.final(), cipher.getAuthTag()]).toString(
			this.cipherTextEncoding
		);

		return cipherText;
	}

	public static decrypt(cipherText: string, secret: string): string {
		const cipherTextAsBuffer = Buffer.from(cipherText, this.cipherTextEncoding);
		const salt = cipherTextAsBuffer.subarray(0, this.saltLength);
		const content = cipherTextAsBuffer.subarray(this.saltLength, -this.authTagLength);
		const authTag = cipherTextAsBuffer.subarray(-this.authTagLength);

		const { key, iv } = this.deriveKeyAndIv(secret, salt);

		const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
		decipher.setAuthTag(authTag);
		const plainText = Buffer.concat([decipher.update(content), decipher.final()]).toString(this.plainTextEncoding);

		return plainText;
	}

	private static deriveKeyAndIv(secret: string, salt: Buffer): { key: Buffer; iv: Buffer } {
		const derivedKey = crypto.pbkdf2Sync(
			secret,
			salt,
			this.pbkdf2Iterations,
			this.keyLength + this.ivLength,
			this.pbkdf2Digest
		);
		const key = derivedKey.subarray(0, this.keyLength);
		const iv = derivedKey.subarray(this.keyLength);

		return { key, iv };
	}
}
