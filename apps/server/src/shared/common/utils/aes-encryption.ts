import crypto from 'node:crypto';

export const encryptAES = (plainText: string, secret: string): string => {
	const salt = crypto.randomBytes(16);

	const derivedKey = crypto.pbkdf2Sync(secret, salt, 100000, 48, 'sha256');
	const key = derivedKey.subarray(0, 32);
	const iv = derivedKey.subarray(32);

	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
	const cipherText = Buffer.concat([
		Buffer.from('Salted__', 'utf8'),
		salt,
		cipher.update(plainText),
		cipher.final(),
	]).toString('base64');

	console.log(cipherText.length);

	return cipherText;
};

export const decryptAES = (cipherText: string, secret: string): string => {
	const encryptedTextAsBuffer = Buffer.from(cipherText, 'base64');
	const salt = encryptedTextAsBuffer.subarray(8, 24);
	const content = encryptedTextAsBuffer.subarray(24);

	const derivedKey = crypto.pbkdf2Sync(secret, salt, 100000, 48, 'sha256');
	const key = derivedKey.subarray(0, 32);
	const iv = derivedKey.subarray(32);

	const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
	const plainText = Buffer.concat([decipher.update(content), decipher.final()]).toString('utf8');

	return plainText;
};
