const assert = require('assert');
const chai = require('chai');
const CryptoJS = require('crypto-js');

const app = require('../../../src/app');

const storageProviderService = app.service('storageProvider');

describe('storageProvider service', () => {
	const secret = '123456789';
	const testProvider1 = {
		_id: '5836bb5664582c35df3bc215',
		type: 'S3',
		isShared: true,
		accessKeyId: '123456789',
		secretAccessKey: secret,
		endpointUrl: 'http://example.org',
		region: 'eu-de',
		maxBuckets: 200,
	};

	const testProvider2 = {
		_id: '5836bb5664582c35df3bc216',
		type: 'S3',
		isShared: false,
		accessKeyId: '123456789',
		secretAccessKey: secret,
		endpointUrl: 'http://example.org',
		region: 'eu-de',
		maxBuckets: 200,
	};

	before(function before(done) {
		this.timeout(10000);
		Promise.all([
			storageProviderService.create(testProvider1),
			storageProviderService.create(testProvider2),
		]).then(() => {
			done();
		});
	});

	after((done) => {
		Promise.all([
			storageProviderService.remove(testProvider1),
			storageProviderService.remove(testProvider2),
		]).then(() => {
			done();
		});
	});

	it('registered the storage provider service', () => {
		assert.ok(storageProviderService);
	});

	it('encrypts the secret correctly', async () => {
		const provider = await storageProviderService.get(testProvider1);
		const decrypted = CryptoJS.AES
			.decrypt(provider.secretAccessKey, process.env.S3_KEY)
			.toString(CryptoJS.enc.Utf8);
		assert.strictEqual(decrypted, secret);
	});
});
