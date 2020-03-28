const assert = require('assert');
const CryptoJS = require('crypto-js');

const app = require('../../../src/app');

const storageProviderService = app.service('storageProvider');
const testObjects = require('../helpers/testObjects')(app);

describe('storageProvider service', () => {
	it('registered the storage provider service', () => {
		assert.ok(storageProviderService);
	});

	it('encrypts the secret correctly', async () => {
		const secret = '123456789';
		const provider = await testObjects.createTestStorageProvider({ secretAccessKey: secret });
		const decrypted = CryptoJS.AES
			.decrypt(provider.secretAccessKey, process.env.S3_KEY)
			.toString(CryptoJS.enc.Utf8);
		assert.strictEqual(decrypted, secret);
	});

	after(testObjects.cleanup);
});
