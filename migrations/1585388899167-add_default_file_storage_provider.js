const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { info, warning } = require('../src/logger');
const { schoolModel: School } = require('../src/services/school/model');
const { storageProviderSchema } = require('../src/services/storageProvider/model');

const { connect, close } = require('../src/utils/database');

const StorageProvider = mongoose.model('storageProviderMigration', storageProviderSchema, 'storageproviders');

module.exports = {
	up: async function up() {
		await connect();

		if (!process.env.AWS_SECRET_ACCESS_KEY) {
			warning("No AWS config found. Migration will be successful but won't change anything!");
		} else {
			if (!Configuration.has('S3_KEY')) {
				throw new Error('You need to set process.env.S3_KEY to encrypt the old key!');
			}

			await StorageProvider.createCollection();

			let session = null;
			let unassignedSchools = [];
			try {
				session = await StorageProvider.db.startSession();
				session.startTransaction();

				unassignedSchools = await School.countDocuments({ storageProvider: { $exists: false } })
					.session(session)
					.lean()
					.exec();
			} catch (err) {
				if (err.errmsg === 'Transaction numbers are only allowed on a replica set member or mongos') {
					session = undefined;
					unassignedSchools = await School.countDocuments({ storageProvider: { $exists: false } })
						.lean()
						.exec();
				} else {
					throw err;
				}
			}

			info(`Got ${unassignedSchools} unassigned schools.`);

			const S3_KEY = Configuration.get('S3_KEY');
			const secretAccessKey = await CryptoJS.AES.encrypt(process.env.AWS_SECRET_ACCESS_KEY, S3_KEY).toString();

			const [provider] = await StorageProvider.create(
				[
					{
						type: 'S3',
						isShared: true,
						accessKeyId: process.env.AWS_ACCESS_KEY,
						secretAccessKey,
						endpointUrl: process.env.AWS_ENDPOINT_URL,
						region: process.env.AWS_REGION,
						maxBuckets: 200,
						freeBuckets: 200 - unassignedSchools,
					},
				],
				{ session }
			);
			await School.updateMany({ storageProvider: { $exists: false } }, { $set: { storageProvider: provider._id } })
				.session(session)
				.lean()
				.exec();
			if (session) await session.commitTransaction();
			info(`Created default storage provider (${process.env.AWS_ENDPOINT_URL}) for all existing schools.`);
		}

		await close();
	},

	down: async function down() {
		await connect();
		const provider = await StorageProvider.findOneAndDelete({
			endpointUrl: process.env.AWS_ENDPOINT_URL,
			accessKeyId: process.env.AWS_ACCESS_KEY,
		})
			.lean()
			.exec();
		if (provider) {
			await School.updateMany({ storageProvider: provider._id }, { $unset: { storageProvider: true } })
				.lean()
				.exec();
		}
		await close();
	},
};
