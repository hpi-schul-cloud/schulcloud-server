const mongoose = require('mongoose');
const aws = require('aws-sdk');
const { Configuration } = require('@hpi-schul-cloud/commons');
const CryptoJS = require('crypto-js');

// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { storageProviderSchema } = require('../src/services/storageProvider/model');
const { schoolSchema, schoolModel } = require('../src/services/school/model');

const StorageProviderModel = mongoose.model('storageprovider65373489214', storageProviderSchema, 'storageproviders');
const SchoolModel = mongoose.model('schools34838583553', schoolSchema, 'schools');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

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

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		const schools = await SchoolModel.aggregate([
			{ $group: { _id: '$storageProvider', schools: { $push: '$_id' } } },
		]).exec();
		/*
        1. call s3 api to list all providerBuckets
        2. find all schools which are assigned to this provider
        3. compare the lists (bucket names are "bucket-" + schoolId)
            case 1: bucket exists - school is okay
            case 2: bucket does not exist
                either the school does not have a bucket yet (remove storage provider attribute in school)
                or the school is assigned to the wrong storage provider (change school attribute)
        */
		const storageProviders = await StorageProviderModel.find().lean().exec();
		for (const provider of storageProviders) {
			const providerSchools = schools.filter((s) => s._id);
			if (providerSchools.length > 0) {
				const schoolsWithThisProvider = providerSchools[0].schools;
				const schoolIds = schoolsWithThisProvider.map((s) => s._id);
				// eslint-disable-next-line no-await-in-loop
				const s3 = await getAWSS3(provider);

				s3.listBuckets((err, data) => {
					if (err) error(err, err.stack);
					else {
						const providerBuckets = data.Buckets.map((b) => b.Name);
						const schoolsWithoutBuckets = [];
						for (const schoolId of schoolIds) {
							const bucketExists = providerBuckets.indexOf(`bucket-${schoolId.toString()}`) >= 0;
							if (!bucketExists) {
								schoolsWithoutBuckets.push(schoolId);
							}
						}

						info(providerBuckets);
					}
				});
			}
		}

		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.

		// ////////////////////////////////////////////////////
		await close();
	},
};

module.exports.up();
