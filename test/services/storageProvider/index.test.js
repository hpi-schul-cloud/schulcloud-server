const assert = require('assert');
const CryptoJS = require('crypto-js');
const { Configuration } = require('@schul-cloud/commons');

describe('storageProvider service', () => {
	let configBefore = {};
	let storageProviderService = null;
	let testObjects = null;

	before(() => {
		configBefore = Configuration.toObject(); // deep copy current config
		Configuration.set('S3_KEY', '1234567891234567');

		const app = require('../../../src/app');

		storageProviderService = app.service('storageProvider');
		testObjects = require('../helpers/testObjects')(app);
	});

	it('registered the storage provider service', () => {
		assert.ok(storageProviderService);
	});

	it('encrypts the secret correctly', async () => {
		const secret = '123456789';
		const provider = await testObjects.createTestStorageProvider({ secretAccessKey: secret });
		const decrypted = CryptoJS.AES
			.decrypt(provider.secretAccessKey, Configuration.get('S3_KEY'))
			.toString(CryptoJS.enc.Utf8);
		assert.strictEqual(decrypted, secret);
	});

	after(() => {
		testObjects.cleanup();
		Configuration.reset(configBefore);
	});
});
