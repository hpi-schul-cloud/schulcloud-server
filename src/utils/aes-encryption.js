const crypto = require('node:crypto');

const encryptionAlgorithm = 'aes-256-gcm';

function encryptAes(plainText, secret) {
	const salt = crypto.randomBytes(16);

	const { key, iv } = deriveKeyAndIv(secret, salt);

	const cipher = crypto.createCipheriv(encryptionAlgorithm, key, iv);
	const cipherText = Buffer.concat([
		Buffer.from('Salted__', 'utf8'),
		salt,
		cipher.update(plainText),
		cipher.final(),
		cipher.getAuthTag(),
	]).toString('base64');

	return cipherText;
}

function decryptAes(cipherText, secret) {
	const cipherTextAsBuffer = Buffer.from(cipherText, 'base64');
	const salt = cipherTextAsBuffer.subarray(8, 24);
	const content = cipherTextAsBuffer.subarray(24, -16);
	const authTag = cipherTextAsBuffer.subarray(-16);

	const { key, iv } = deriveKeyAndIv(secret, salt);

	const decipher = crypto.createDecipheriv(encryptionAlgorithm, key, iv);
	decipher.setAuthTag(authTag);
	const plainText = Buffer.concat([decipher.update(content), decipher.final()]).toString('utf8');

	return plainText;
}

function deriveKeyAndIv(secret, salt) {
	const derivedKey = crypto.pbkdf2Sync(secret, salt, 100000, 48, 'sha256');
	const key = derivedKey.subarray(0, 32);
	const iv = derivedKey.subarray(32);

	return { key, iv };
}

module.exports = {
	encryptAes,
	decryptAes,
};
