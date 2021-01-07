const mongoose = require('mongoose');
const aws = require('aws-sdk');
const { Configuration } = require('@hpi-schul-cloud/commons');
const CryptoJS = require('crypto-js');

// eslint-disable-next-line no-unused-vars
const { info, warn } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { storageProviderSchema } = require('../src/services/storageProvider/model');
const { schoolSchema } = require('../src/services/school/model');

const StorageProviderModel = mongoose.model('storageprovider65373489214', storageProviderSchema, 'storageproviders');
const SchoolModel = mongoose.model('schools34838583553', schoolSchema, 'schools');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

const EMPTY_PROVIDER = 'NOT_FOUND';

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
	return undefined;
};

const updateProvidersForSchools = async (foundSchoolsPerProvider) => {
	for (const [provider, schools] of Object.entries(foundSchoolsPerProvider)) {
		if (provider !== EMPTY_PROVIDER) {
			// eslint-disable-next-line no-await-in-loop
			const result = await SchoolModel.updateMany(
				{
					id: { $in: schools },
				},
				{ $set: { storageProvider: provider } }
			).exec();
			info(`${schools.length} schools successfully updated for provider ${provider}: ${result}`);
		} else {
			warn(`${schools.length} schools couldn't be assigned to any provider`);
		}
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
		let provider = getProviderForSchool(bucketsPerProvider, school);
		if (provider === undefined) {
			provider = EMPTY_PROVIDER;
		}
		const schoolsForProvider = foundSchoolsPerProvider[provider] || [];
		schoolsForProvider.push(school);
		foundSchoolsPerProvider[provider] = schoolsForProvider;
	}
	return foundSchoolsPerProvider;
};

module.exports = {
	up: async function up() {
		await connect();
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
			await updateProvidersForSchools(foundSchoolsPerProvider);
		}

		await close();
	},

	down: (done) => {
		info('This migration is idempotent. Nothing should be reseted');
		done();
	},
};

module.exports.up();
