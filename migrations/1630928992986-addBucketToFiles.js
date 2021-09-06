const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { Schema } = mongoose;

const FileModel = mongoose.model(
	'file_20210906',
	new mongoose.Schema({
		refOwnerModel: { type: String },
		owner: { type: Schema.Types.ObjectId },
		bucket: { type: String },
	}),
	'files'
);

const UserModel = mongoose.model(
	'user_20210906',
	new mongoose.Schema({
		schoolId: { type: Schema.Types.ObjectId },
	}),
	'users'
);

const CourseModel = mongoose.model(
	'course_20210906',
	new mongoose.Schema({
		schoolId: { type: Schema.Types.ObjectId },
	}),
	'courses'
);

const TeamModel = mongoose.model(
	'team_20210906',
	new mongoose.Schema({
		schoolIds: { type: [Schema.Types.ObjectId] },
	}),
	'teams'
);

const ownerModel = {
	user: UserModel,
	course: CourseModel,
	teams: TeamModel,
};

module.exports = {
	up: async function up() {
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
			}
		}
		await close();
		alert('Done!');
	},

	down: async function down() {
		await connect();
		await FileModel.updateMany({}, { $unset: { bucket: '' } });
		await close();
	},
};
