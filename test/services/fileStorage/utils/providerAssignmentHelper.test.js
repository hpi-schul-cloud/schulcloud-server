const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');

const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);

const { schoolModel } = require('../../../../src/services/school/schools.model');

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
		const schoolId = 'TEST_SCHOOL';
		const TEST_PROVIDER = 'TEST_PROVIDER';

		const bucketsPerProvider = {};
		bucketsPerProvider[TEST_PROVIDER] = [`bucket-${schoolId}`];
		const provider = await findProviderForSchool(bucketsPerProvider, schoolId);
		expect(provider).to.be.equal(TEST_PROVIDER);
	});

	it('if provider for school was not found, it should return undefined', async () => {
		const schoolId = 'TEST_SCHOOL';

		const bucketsPerProvider = {};
		const provider = await findProviderForSchool(bucketsPerProvider, schoolId);
		expect(provider).to.be.equal(undefined);
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

	it('should not update provider for school if provider was not found', async () => {
		const testStorageProvider = await testObjects.createTestStorageProvider({ secretAccessKey: '123456789' });
		let testSchool = await testObjects.createTestSchool({ storageProvider: testStorageProvider });

		const provider2Id = undefined;

		await updateProviderForSchool(provider2Id, testSchool._id.toString());
		testSchool = (await schoolModel.findById(testSchool._id)).toObject();
		expect(testSchool.storageProvider.toString()).to.be.equal(testStorageProvider._id.toString());
	});
});
