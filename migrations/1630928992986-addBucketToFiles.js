const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { Schema } = mongoose;

const { userModel } = require('../src/services/user/model');
const { courseModel } = require('../src/services/user-group/model');
const { teamsModel } = require('../src/services/teams/model');

const FileModel = mongoose.model(
	'file_20210906',
	new mongoose.Schema({
		refOwnerModel: { type: String },
		owner: { type: Schema.Types.ObjectId },
		bucket: { type: String },
	}),
	'files'
);

const ownerModel = {
	user: userModel,
	course: courseModel,
	teams: teamsModel,
};

module.exports = {
	up: async function up() {
		let errorCode = 1;
		alert('Start adding buckets to file documents...');
		await connect();
		const files = FileModel.find({ bucket: { $exists: false } });
		const fileCount = await files.count();
		alert(`${fileCount} files will be processed...`);
		for await (const file of files) {
			try {
				const ownerType = file.refOwnerModel;
				const owner = await ownerModel[ownerType].findById(file.owner);
				const schoolId = ownerType === 'teams' ? owner.schoolIds[0] : owner.schoolId;
				const bucket = `bucket-${schoolId}`;
				file.bucket = bucket;
				await file.save();
			} catch (err) {
				error(`bucket could not be added to the file ${file._id}`, err);
				errorCode = 1;
			}
		}
		await close();
		alert('Done!');
		process.exit(errorCode);
	},

	down: async function down() {
		await connect();
		await FileModel.updateMany({}, { $unset: { bucket: '' } });
		await close();
	},
};
