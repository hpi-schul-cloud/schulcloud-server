import crypto from 'node:crypto';

export class AesEncryptionHelper {
	private static readonly encryptionAlgorithm = 'aes-256-gcm';

	public static encrypt(plainText: string, secret: string): string {
		const salt = crypto.randomBytes(16);

		const { key, iv } = this.deriveKeyAndIv(secret, salt);

		const cipher = crypto.createCipheriv(this.encryptionAlgorithm, key, iv);
		const cipherText = Buffer.concat([
			Buffer.from('Salted__', 'utf8'),
			salt,
			cipher.update(plainText),
			cipher.final(),
			cipher.getAuthTag(),
		]).toString('base64');

		return cipherText;
	}

	public static decrypt(cipherText: string, secret: string): string {
		const cipherTextAsBuffer = Buffer.from(cipherText, 'base64');
		const salt = cipherTextAsBuffer.subarray(8, 24);
		const content = cipherTextAsBuffer.subarray(24, -16);
		const authTag = cipherTextAsBuffer.subarray(-16);

		const { key, iv } = this.deriveKeyAndIv(secret, salt);

		const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, key, iv);
		decipher.setAuthTag(authTag);
		const plainText = Buffer.concat([decipher.update(content), decipher.final()]).toString('utf8');

		return plainText;
	}

	private static deriveKeyAndIv(secret: string, salt: Buffer): { key: Buffer; iv: Buffer } {
		const derivedKey = crypto.pbkdf2Sync(secret, salt, 100000, 48, 'sha256');
		const key = derivedKey.subarray(0, 32);
		const iv = derivedKey.subarray(32);

		return { key, iv };
	}
}
