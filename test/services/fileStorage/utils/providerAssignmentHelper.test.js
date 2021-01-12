const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');

const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);

const { schoolModel } = require('../../../../src/services/school/model');

const {
	findProviderForSchool,
	updateProviderForSchool,
} = require('../../../../src/services/fileStorage/utils/providerAssignmentHelper');

describe('providerAssignmentHelper', () => {
	before(async () => {
		Configuration.set('S3_KEY', 'udsfhuidsfhdsjbfdhsfbdhf');
	});

	after(async () => {
		await testObjects.cleanup();
	});

	it('find provider for school should return correct provider', async () => {
		const testStorageProvider = await testObjects.createTestStorageProvider({ secretAccessKey: '123456789' });
		const testStorageProvider2 = await testObjects.createTestStorageProvider({ secretAccessKey: '123456789' });
		const testSchool = await testObjects.createTestSchool({ storageProvider: testStorageProvider });

		const schoolId = testSchool._id.toString();
		const provider2Id = testStorageProvider2._id.toString();

		const bucketsPerProvider = {};
		bucketsPerProvider[provider2Id] = [`bucket-${schoolId}`];
		const provider = await findProviderForSchool(bucketsPerProvider, schoolId);
		expect(provider).to.be.equal(provider2Id);
	});

	it('update provider for school should correctly update the storage provider for given school', async () => {
		const testStorageProvider = await testObjects.createTestStorageProvider({ secretAccessKey: '123456789' });
		const testStorageProvider2 = await testObjects.createTestStorageProvider({ secretAccessKey: '123456789' });
		let testSchool = await testObjects.createTestSchool({ storageProvider: testStorageProvider });

		const provider2Id = testStorageProvider2._id.toString();

		await updateProviderForSchool(provider2Id, testSchool._id.toString());
		testSchool = (await schoolModel.findById(testSchool._id)).toObject();
		expect(testSchool.storageProvider.toString()).to.be.equal(testStorageProvider2._id.toString());
	});
});
