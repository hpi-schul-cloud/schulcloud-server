const sinon = require('sinon');
const CryptoJS = require('crypto-js');
const aws = require('aws-sdk');
const { expect } = require('chai');
const mongoose = require('mongoose');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { info } = require('../../../../src/logger');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);

const { storageProviderSchema } = require('../../../../src/services/storageProvider/model');
const { schoolSchema } = require('../../../../src/services/school/model');

const StorageProviderModel = mongoose.model('storageprovider65373489214', storageProviderSchema, 'storageproviders');
const SchoolModel = mongoose.model('schools34838583553', schoolSchema, 'schools');

const { findCorrectStorageProvider } = require('../../../../src/services/fileStorage/utils/providerAssignmentHelper');

const EMPTY_PROVIDER = null;

const getConfig = (provider) => {
	const awsConfig = new aws.Config({
		signatureVersion: 'v4',
		s3ForcePathStyle: true,
		sslEnabled: true,
		accessKeyId: provider.accessKeyId,
		secretAccessKey: provider.secretAccessKey,
		region: provider.region,
		endpointUrl: provider.endpointUrl,
	});
	awsConfig.endpoint = new aws.Endpoint(provider.endpointUrl);
	return awsConfig;
};

const getAWSS3 = async (storageProvider) => {
	const S3_KEY = Configuration.get('S3_KEY');

	storageProvider.secretAccessKey = CryptoJS.AES.decrypt(storageProvider.secretAccessKey, S3_KEY).toString(
		CryptoJS.enc.Utf8
	);
	return new aws.S3(getConfig(storageProvider));
};

const getBuckets = async (provider) => {
	const s3 = await getAWSS3(provider);
	const response = await s3.listBuckets().promise();
	return response.Buckets ? response.Buckets.map((b) => b.Name) : [];
};

const getSchoolsWithoutBucketsForProvider = (providerSchools, buckets) => {
	const schoolsWithThisProvider = providerSchools[0].schools;
	const schoolIds = schoolsWithThisProvider.map((s) => s._id);
	const schoolsWithoutBuckets = [];
	for (const schoolId of schoolIds) {
		const bucketExists = buckets.indexOf(`bucket-${schoolId.toString()}`) >= 0;
		if (!bucketExists) {
			schoolsWithoutBuckets.push(schoolId);
		}
	}
	return schoolsWithoutBuckets;
};

const getBucketsPerProvider = async (storageProviders) => {
	const bucketsForProvider = {};
	for (const provider of storageProviders) {
		// eslint-disable-next-line no-await-in-loop
		bucketsForProvider[provider._id] = await getBuckets(provider);
	}
	return bucketsForProvider;
};

const getProviderForSchool = (bucketsForProvider, school) => {
	for (const [provider, buckets] of Object.entries(bucketsForProvider)) {
		const bucketExists = buckets.indexOf(`bucket-${school.toString()}`) >= 0;
		if (bucketExists) return provider;
	}
	return EMPTY_PROVIDER;
};

const printSchoolsForProvider = async (foundSchoolsPerProvider) => {
	for (const [provider, schools] of Object.entries(foundSchoolsPerProvider)) {
		info(`For provider ${provider} found schools: ${JSON.stringify(schools)}`);
	}
};

const updateProvidersForSchools = async (foundSchoolsPerProvider) => {
	// eslint-disable-next-line prefer-const
	for (let [provider, schools] of Object.entries(foundSchoolsPerProvider)) {
		if (provider === 'null') {
			provider = null;
		}
		// eslint-disable-next-line no-await-in-loop
		const result = await SchoolModel.updateMany(
			{
				_id: { $in: schools },
			},
			{ $set: { storageProvider: provider } }
		).exec();
		info(`${schools.length} schools successfully updated for provider ${provider}: ${result}`);
	}
};

const getSchoolsWithWrongProviders = (bucketsPerProvider, schoolsByProvider) => {
	let schoolsWithoutBuckets = [];
	for (const [provider, buckets] of Object.entries(bucketsPerProvider)) {
		const providerSchools = schoolsByProvider.filter((s) => s._id === provider);
		if (providerSchools.length > 0) {
			const schoolsWithoutBucketsForProvider = getSchoolsWithoutBucketsForProvider(providerSchools, buckets);
			info(`Found ${schoolsWithoutBucketsForProvider.length} for provider ${provider}`);
			schoolsWithoutBuckets = schoolsWithoutBuckets.concat(schoolsWithoutBucketsForProvider);
		}
	}
	return schoolsWithoutBuckets;
};

const findProvidersForSchools = (schoolsWithoutBuckets, bucketsPerProvider) => {
	const foundSchoolsPerProvider = {};
	for (const school of schoolsWithoutBuckets) {
		const provider = getProviderForSchool(bucketsPerProvider, school);
		const schoolsForProvider = foundSchoolsPerProvider[provider] || [];
		schoolsForProvider.push(school);
		foundSchoolsPerProvider[provider] = schoolsForProvider;
	}
	return foundSchoolsPerProvider;
};

describe('providerAssignmentHelper', () => {
    let getBucketsStub;
	before(async () => {
		Configuration.set('S3_KEY', 'udsfhuidsfhdsjbfdhsfbdhf');

        getBucketsStub = sinon.stub(userRepo, 'getUserRoles');
        getBucketsStub.withArgs(userId).returns([{ name: 'student' }]);
	});

	after(async () => {
		await testObjects.cleanup();
	});

	it('test AWS connection', async () => {
		const testStorageProvider = await testObjects.createTestStorageProvider({ secretAccessKey: '123456789' });

		const testSchool = await testObjects.createTestSchool({ storageProvider: testStorageProvider });

		const provider = await findCorrectStorageProvider(testSchool._id.toString());

		expect(testSchool.storageProvider._id.toString()).to.equal(testStorageProvider._id.toString());

		// 0. get all storage providers from the database
		const storageProviders = await StorageProviderModel.find().lean().exec();

		// 1. call s3 api to list all providerBuckets
		const bucketsPerProvider = await getBucketsPerProvider(storageProviders);

		// 2. find all schools which are assigned to this provider
		const schoolsByProvider = await SchoolModel.aggregate([
			{ $group: { _id: '$storageProvider', schools: { $push: '$_id' } } },
		]).exec();

		// 3. find schools with wrong providers assigned
		const schoolsWithWrongProviders = getSchoolsWithWrongProviders(bucketsPerProvider, schoolsByProvider);
		if (schoolsWithWrongProviders.length === 0) {
			info(`There aren't any school with wrong providers were found`);
		} else {
			// 3.1 try to find buckets by another providers
			const foundSchoolsPerProvider = findProvidersForSchools(schoolsWithWrongProviders, bucketsPerProvider);

			// 3.2. update schools by found providers
			await printSchoolsForProvider(foundSchoolsPerProvider);
		}
	});
});
