const mongoose = require('mongoose');

const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const AWSStrategie = require('../src/services/fileStorage/strategies/awsS3');

const { storageProviderSchema } = require('../src/services/storageProvider/model');
const { schoolSchema } = require('../src/services/school/model');

const StorageProviderModel = mongoose.model('storageprovider65373489214', storageProviderSchema, 'storageproviders');
const SchoolModel = mongoose.model('schools34838583553', schoolSchema, 'schools');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

const EMPTY_PROVIDER = 'NOT_FOUND';

/**
 * Retrieves all bucket names for provider
 * @param provider
 * @returns {Promise<void>} - bucket names
 */
const getBucketsNamesForProvider = async (provider) => {
	const awsStrategie = new AWSStrategie();
	const s3 = awsStrategie.connect(provider, false);
	const aWSObject = { s3 };
	return awsStrategie.listBucketsNames(aWSObject);
};

/**
 * Gets schools without buckets in the provider
 * @param providerSchools - schools with provider
 * @param buckets - buckets by provider
 * @returns {[]} - schools without buckets
 */
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

/**
 * Get buckets for all storage providers
 * @param storageProviders
 * @returns {Promise<{}>} - map {provider: [buckets]}
 */
const getBucketsPerProvider = async (storageProviders) => {
	const bucketsForProvider = {};
	for (const provider of storageProviders) {
		// eslint-disable-next-line no-await-in-loop
		bucketsForProvider[provider._id] = await getBucketsNamesForProvider(provider);
	}
	return bucketsForProvider;
};

/**
 * Search for schoolId by every provider. Comparing schoolId with bucket name
 * @param bucketsForProvider
 * @param school
 * @returns {string}
 */
const getProviderForSchool = (bucketsForProvider, school) => {
	for (const [provider, buckets] of Object.entries(bucketsForProvider)) {
		const bucketExists = buckets.indexOf(`bucket-${school.toString()}`) >= 0;
		if (bucketExists) return provider;
	}
	return EMPTY_PROVIDER;
};

/**
 * Update provider for schools in the list
 * @param foundSchoolsPerProvider - {correct provider: [schools]}
 * @returns {Promise<void>} update result
 */
const updateProvidersForSchools = async (foundSchoolsPerProvider) => {
	for (const [provider, schools] of Object.entries(foundSchoolsPerProvider)) {
		if (provider !== EMPTY_PROVIDER) {
			// eslint-disable-next-line no-await-in-loop
			const result = await SchoolModel.updateMany(
				{
					_id: { $in: schools },
				},
				{ $set: { storageProvider: provider } }
			).exec();

			error(
				`${JSON.stringify(schools)} schools successfully updated for provider ${provider}: ${JSON.stringify(result)}`
			);
		} else {
			error(`${JSON.stringify(schools)} schools couldn't be assigned to any provider`);
		}
	}
};

/**
 * For each provider try to find bucket for the school. If the bucket was not found add it to the output array
 * @param bucketsPerProvider - map {provider: [buckets]}
 * @param schoolsByProvider - map {provider: [schools]}
 * @returns [] - schoolsWithoutBuckets by their own provider
 */
const getSchoolsWithWrongProviders = (bucketsPerProvider, schoolsByProvider) => {
	let schoolsWithoutBuckets = [];
	for (const [provider, buckets] of Object.entries(bucketsPerProvider)) {
		const providerSchools = schoolsByProvider.filter((s) => s._id !== null && s._id.toString() === provider);
		if (providerSchools.length > 0) {
			const schoolsWithoutBucketsForProvider = getSchoolsWithoutBucketsForProvider(providerSchools, buckets);
			error(
				`Found schools with wrong provider buckets ${JSON.stringify(
					schoolsWithoutBucketsForProvider
				)} for provider ${provider}`
			);
			schoolsWithoutBuckets = schoolsWithoutBuckets.concat(schoolsWithoutBucketsForProvider);
		}
	}
	return schoolsWithoutBuckets;
};

/**
 * For each school without bucket try to find provider
 * @param schoolsWithoutBuckets - schools which don't have buckets by their provider
 * @param bucketsPerProvider - map {provider: [buckets]}
 * @returns {{}} - map {provider: [schools]}
 */
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

module.exports = {
	up: async function up() {
		await connect();
		// 0. get all storage providers from the database
		const storageProviders = await StorageProviderModel.find().lean().exec();

		// 1. call s3 api to list all providerBuckets
		const bucketsPerProvider = await getBucketsPerProvider(storageProviders);
		error(`buckets per provider: ${JSON.stringify(bucketsPerProvider)}`);

		// 2. find all schools which are assigned to this provider
		const schoolsByProvider = await SchoolModel.aggregate([
			{ $group: { _id: '$storageProvider', schools: { $push: '$_id' } } },
		]).exec();

		// 3. find schools with wrong providers assigned
		const schoolsWithWrongProviders = getSchoolsWithWrongProviders(bucketsPerProvider, schoolsByProvider);

		if (schoolsWithWrongProviders.length === 0) {
			error(`There aren't any school with wrong providers were found`);
		} else {
			error(`Found schools with wrong providers: ${JSON.stringify(schoolsWithWrongProviders)}`);
			// 3.1 try to find buckets by another providers
			const foundSchoolsPerProvider = findProvidersForSchools(schoolsWithWrongProviders, bucketsPerProvider);
			error(`Found schools with corrected providers: ${JSON.stringify(foundSchoolsPerProvider)}`);
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
