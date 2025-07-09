import crypto from 'node:crypto';

// The functions are copied from https://github.com/RaisinTen/aes-crypto-js/blob/v0.1.0/index.js.

// Refs: https://github.com/brix/crypto-js/issues/468#issuecomment-2060562277
export const encryptAES = (plainText: string, secret: string): string => {
	const salt = crypto.randomBytes(8);
	const password = Buffer.concat([Buffer.from(secret), salt]);
	const hashes: Buffer[] = [];
	let digest = password;
	for (let i = 0; i < 3; i++) {
		hashes[i] = crypto.createHash('md5').update(digest).digest();
		digest = Buffer.concat([hashes[i], password]);
	}
	const key = Buffer.concat([hashes[0], hashes[1]]);
	const iv = hashes[2];
	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

	return Buffer.concat([Buffer.from('Salted__', 'utf8'), salt, cipher.update(plainText), cipher.final()]).toString(
		'base64'
	);
};

// Refs: https://github.com/brix/crypto-js/issues/468#issuecomment-1783351942
export const decryptAES = (encryptedText: string, secret: string): string => {
	// From https://gist.github.com/schakko/2628689?permalink_comment_id=3321113#gistcomment-3321113
	// From https://gist.github.com/chengen/450129cb95c7159cb05001cc6bdbf6a1
	const encryptedTextAsBuffer = Buffer.from(encryptedText, 'base64');
	const salt = encryptedTextAsBuffer.subarray(8, 16);
	const content = encryptedTextAsBuffer.subarray(16);
	const password = Buffer.concat([Buffer.from(secret), salt]);
	const hashes: Buffer[] = [];
	let digest = password;
	for (let i = 0; i < 3; i++) {
		hashes[i] = crypto.createHash('md5').update(digest).digest();
		digest = Buffer.concat([hashes[i], password]);
	}
	const key = Buffer.concat([hashes[0], hashes[1]]);
	const iv = hashes[2];
	const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

	return Buffer.concat([decipher.update(content), decipher.final()]).toString('utf8');
};
