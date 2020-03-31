const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
const { Configuration } = require('@schul-cloud/commons');

const { info, error } = require('../src/logger');
const { schoolModel: School } = require('../src/services/school/model');

const { connect, close } = require('../src/utils/database');

const StorageProvider = mongoose.model('storageProviderMigration', new mongoose.Schema({
	type: { type: String, enum: ['S3'], required: true },
	isShared: { type: Boolean },
	accessKeyId: { type: String, required: true },
	secretAccessKey: { type: String, required: true },
	endpointUrl: { type: String, required: true },
	region: { type: String },
	maxBuckets: { type: Number, required: true },
	schools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'school' }],
}, {
	timestamps: true,
}), 'storageproviders');

module.exports = {
	up: async function up() {
		await connect();
		const S3_KEY = Configuration.get('S3_KEY');

		if (!process.env.AWS_SECRET_ACCESS_KEY) {
			info('No AWS config found. Migration will be successful but won\'t change anything!');
		} else {
			if (!S3_KEY) {
				error('You need to set process.env.S3_KEY to encrypt the old key!');
			}

			let schools = await School.find({})
				.select(['_id'])
				.lean({ virtuals: true })
				.exec();
			schools = schools.map((s) => s._id);
			info(`Got ${schools.length} schools.`);

			const providers = await StorageProvider.find({ $where: 'this.schools.length > 0' })
				.select(['schools'])
				.lean()
				.exec();

			const assignedSchools = [...providers.map((p) => p.schools)].map((s) => s.toString());
			info(`Got ${assignedSchools.length} schools that already use another provider.`);

			const secretAccessKey = CryptoJS.AES.encrypt(process.env.AWS_SECRET_ACCESS_KEY, S3_KEY);
			const provider = new StorageProvider({
				type: 'S3',
				isShared: true,
				accessKeyId: process.env.AWS_ACCESS_KEY,
				secretAccessKey,
				endpointUrl: process.env.AWS_ENDPOINT_URL,
				region: process.env.AWS_REGION || 'eu-de',
				maxBuckets: 200,
				schools: schools.filter((s) => !assignedSchools.includes(s.toString())), // only unassigned schools
			});
			await provider.save();
			info(`Created default storage provider (${process.env.AWS_ENDPOINT_URL}) for all existing schools.`);
		}

		await close();
	},

	down: async function down() {
		await connect();
		await StorageProvider.deleteOne({
			endpointUrl: process.env.AWS_ENDPOINT_URL,
			accessKeyId: process.env.AWS_ACCESS_KEY,
		}).lean().exec();
		await close();
	},
};
