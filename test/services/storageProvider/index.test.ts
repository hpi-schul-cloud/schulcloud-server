import { expect } from 'chai';
import CryptoJS from 'crypto-js';
import { Configuration } from '@hpi-schul-cloud/commons';
import appPromise from '../../../src/app';
import testObjectsImport from '../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);

describe('storageProvider service', () => {
	let app;
	let storageProviderService;

	let configBefore = {};

	before(async () => {
		app = await appPromise;
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
		const decrypted = CryptoJS.AES.decrypt(provider.secretAccessKey, Configuration.get('S3_KEY')).toString(
			CryptoJS.enc.Utf8
		);
		expect(decrypted).to.equal(secret);
	});

	after(async () => {
		await testObjects.cleanup();
		Configuration.reset(configBefore);
	});
});
