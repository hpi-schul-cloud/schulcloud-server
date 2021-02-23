const { Configuration } = require('@hpi-schul-cloud/commons');

const { expect } = require('chai');
const { fileStorageProviderRepo } = require('.');

describe('fileStorageProvider.repo.integration.test', () => {
	let testObjects;
	let server;
	let app;
	let configBefore;

	before(async () => {
		/* eslint-disable global-require */
		configBefore = Configuration.toObject(); // deep copy current config
		app = await require('../../../app');
		testObjects = require('../../../../test/services/helpers/testObjects')(app);
		Configuration.set('S3_KEY', 'abcdefghijklmnop');
		/* eslint-enable global-require */
		server = await app.listen(0);
	});

	after(async () => {
		Configuration.parse(configBefore);
		await server.close();
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	describe('createStorageProviderInstance', () => {
		it('should not throw an error', async () => {
			const storageProviderInfo = {
				accessKeyId: 'minioadmin',
				secretAccessKey: 'minioadmin',
				region: 'eu-west-1',
				endpointUrl: 'http://localhost:9090',
			};
			expect(() => fileStorageProviderRepo.private.createStorageProviderInstance(storageProviderInfo)).to.not.throw();
		});
	});
});
