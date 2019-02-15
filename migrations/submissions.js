const ran = false; // set to true to exclude migration
const name = 'Migrating files of submissions to new file model';

const mongoose = require('mongoose');

const { Schema } = mongoose;
const { submissionModel } = require('../src/services/homework/model.js');
const { FileModel } = require('../src/services/fileStorage/model.js');

mongoose.Promise = global.Promise;

const sanitizeObj = (obj) => {
	Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
	return obj;
};

const convertDocument = (doc) => {
	const [refOwnerModel, owner,] = doc.key.split('/');

	const refOwnerModelMap = {
		users: 'user',
		courses: 'course',
	};

	// Props obsolete in new model
	const nullers = {
		_id: undefined,
		__v: undefined,
		key: undefined,
		path: undefined,
		schoolId: undefined,
		flatFileName: undefined,
		studentCanEdit: undefined,
		permissions: undefined,
	};

	return sanitizeObj({
		...doc,
		isDirectory: !doc.type,
		refOwnerModel: refOwnerModelMap[refOwnerModel] || refOwnerModel,
		owner,
		storageFileName: doc.flatFileName,
		...nullers,
	});
};

const permissionTypes = ['can-read', 'can-write'];

const oldFileSchema = new Schema({
	key: { type: String, required: true, unique: true },
	path: { type: String },
	name: { type: String },
	size: { type: Number },
	type: { type: String },
	flatFileName: { type: String },
	thumbnail: { type: String },
	permissions: [{
		userId: { type: Schema.Types.ObjectId, ref: 'user' },
		permissions: [{ type: String, enum: permissionTypes }],
	}],
	lockId: { type: Schema.Types.ObjectId },
	shareToken: { type: String },
	schoolId: { type: Schema.Types.ObjectId, ref: 'school' },
	studentCanEdit: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

const run = async (dry) => {
	mongoose.connect(process.env.DB_URL || 'mongodb://localhost:27017/schulcloud', { user: process.env.DB_USERNAME, pass: process.env.DB_PASSWORD });

	const oldfileModel = mongoose.model('oldfile', oldFileSchema, '_files');
	const submissionWithFiles = await submissionModel
		.find({ fileIds: { $exists: true, $not: { $size: 0 } } });

	if (!submissionWithFiles.length) {
		return Promise.resolve();
	}

	const promises = submissionWithFiles.map((sub) => {
		return Promise.all(sub.fileIds.map(id => oldfileModel.findOne({ _id: id }).lean().exec()))
			.then((files) => {
				const docPromises = files
					.filter(f => Boolean(f))
					.map(convertDocument)
					.map(d => FileModel.findOne(d).exec());
				return Promise.all(docPromises);
			})
			.then((files) => {
				const fileIds = files.map(f => f._id);
				
				if(!fileIds.length)  {
					return Promise.resolve();
				}
				
				console.log(`New fileIds for submissons ${sub._id}`, fileIds);
				return dry ? Promise.resolve() : submissionModel.update({ _id: sub._id }, { fileIds }).exec();
			});
	});

	return Promise.all(promises);
};

module.exports = {
	ran,
	name,
	run,
};
