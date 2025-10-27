const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { AesEncryptionHelper } = require('../../../dist/apps/server/shared/common/utils/aes-encryption');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise());

describe('storageProvider service', () => {
	let app;
	let storageProviderService;

	let configBefore = {};

	before(async () => {
		app = await appPromise();
		storageProviderService = app.service('storageProvider');
		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('S3_KEY', '1234567891234567');
	});

	it('registered the storage provider service', () => {
		expect(storageProviderService).to.be.ok;
	});

	it('encrypts the secret correctly', async () => {
		const secret = '123456789';
		const provider = await testObjects.createTestStorageProvider({ secretAccessKey: secret });
		const decrypted = AesEncryptionHelper.decrypt(provider.secretAccessKey, Configuration.get('S3_KEY'));
		expect(decrypted).to.equal(secret);
	});

	after(async () => {
		await testObjects.cleanup();
		Configuration.reset(configBefore);
	});
});
