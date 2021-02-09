const CryptoJS = require('crypto-js');
const { Configuration } = require('@hpi-schul-cloud/commons');
const mongoose = require('mongoose');
const { StorageProviderModel } = require('../../storageProvider/model');

const { schoolsRepo } = require('../repo');

const chooseProvider = async (schoolId) => {
	let providers = [];
	let provider;
	const session = await mongoose.startSession(); //ToDo: How to allign with new architecture
	await session.withTransaction(
		async () => {
			// We need to figure out if we run in a replicaset, because DB-calls with transaction
			// will fail if not run in a replicaset.
			const effectiveSession = session.clientOptions.replicaSet ? session : undefined;
			providers = await StorageProviderModel.find({ isShared: true })
				.sort({ freeBuckets: -1 })
				.limit(1)
				.session(effectiveSession)
				.lean()
				.exec();

			if (!Array.isArray(providers) || providers.length === 0) throw new Error('No available provider found.');
			provider = providers[0];

			await Promise.all([
				StorageProviderModel.findByIdAndUpdate(provider._id, { $inc: { freeBuckets: -1 } })
					.session(effectiveSession)
					.lean()
					.exec(),
				schoolModel
					.findByIdAndUpdate(schoolId, { $set: { storageProvider: provider._id } })
					.session(effectiveSession)
					.lean()
					.exec(),
			]);
		},
		{ readPreference: 'primary' } // transactions will only work with readPreference = 'primary'
	);
	session.endSession();
	return provider;
};

const decryptAccessKeyForStorageProvider = async (storageProvider, schoolId) => {
	const S3_KEY = Configuration.get('S3_KEY');
	if (!storageProvider) {
		storageProvider = await chooseProvider(schoolId);
	}
	storageProvider.secretAccessKey = CryptoJS.AES.decrypt(storageProvider.secretAccessKey, S3_KEY).toString(
		CryptoJS.enc.Utf8
	);
};

const getStorageProviderForSchool = async (schoolId) => {
	const storageProvider = await schoolsRepo.getStorageProviderForSchool(schoolId);
	await decryptAccessKeyForStorageProvider(storageProvider, schoolId);
	return storageProvider;
};

module.exports = { getStorageProviderForSchool };
