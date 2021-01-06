const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { storageProviderSchema } = require('../src/services/storageProvider/model');
const { schoolSchema, schoolModel } = require('../src/services/school/model');

const StorageProviderModel = mongoose.model('storageprovider65373489214', storageProviderSchema, 'storageproviders');
const SchoolModel = mongoose.model('schools34838583553', schoolSchema, 'schools');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		const schools = await schoolModel
			.aggregate([{ $group: { _id: '$storageProvider', schools: { $push: '$_id' } } }])
			.exec();

		const storageProviders = await StorageProviderModel.find({ isShared: true }).lean().exec();
		for (const provider of storageProviders) {
			const schoolsWithThisProvider = schools[provider._id].schools;
			/*
			1. call s3 api to list all buckets
			2. find all schools which are assigned to this provider
			3. compare the lists (bucket names are "bucket-" + schoolId)
				case 1: bucket exists - school is okay
				case 2: bucket does not exist
					either the school does not have a bucket yet (remove storage provider attribute in school)
					or the school is assigned to the wrong storage provider (change school attribute)
			*/
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
