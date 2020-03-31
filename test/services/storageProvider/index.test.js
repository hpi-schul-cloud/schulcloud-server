const assert = require('assert');
const CryptoJS = require('crypto-js');
const { Configuration } = require('@schul-cloud/commons');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const storageProviderService = app.service('storageProvider');

describe('storageProvider service', () => {
	let configBefore = {};

	before(() => {
		configBefore = Configuration.toObject(); // deep copy current config
		Configuration.set('S3_KEY', '1234567891234567');
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
