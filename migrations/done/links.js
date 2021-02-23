/* eslint no-console: 0 */
/* eslint no-confusing-arrow: 0 */
const ran = true; // set to true to exclude migration
const name = 'Migrating links to new file model';

const mongoose = require('mongoose');
const database = require('../../src/utils/database');

const { Schema } = mongoose;
const LinkModel = require('../../src/services/link/link-model');
const { FileModel } = require('../../src/services/fileStorage/model.js');

mongoose.Promise = global.Promise;

const sanitizeObj = (obj) => {
	Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
	return obj;
};

const convertDocument = (doc) => {
	const [refOwnerModel, owner] = doc.key.split('/');

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
	permissions: [
		{
			userId: { type: Schema.Types.ObjectId, ref: 'user' },
			permissions: [{ type: String, enum: permissionTypes }],
		},
	],
	lockId: { type: Schema.Types.ObjectId },
	shareToken: { type: String },
	schoolId: { type: Schema.Types.ObjectId, ref: 'school' },
	studentCanEdit: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

const run = async (dry) => {
	database.connect();

	const oldfileModel = mongoose.model('oldfile', oldFileSchema, '_files');
	const linkObjects = await LinkModel.find({ target: { $regex: '/files/fileModel/' } }).exec();
	const regex = RegExp('(.+?/files/fileModel/)(.*?)(/.*)');

	const errorHandler = (e) => {
		console.log('Error', e);
		return undefined;
	};

	const promises = linkObjects.map((link) => {
		const { target } = link;
		const id = target.replace(regex, '$2');

		return oldfileModel
			.findOne({ _id: id })
			.lean()
			.exec()
			.catch(errorHandler)
			.then((file) => (file ? FileModel.findOne(convertDocument(file)).exec().catch(errorHandler) : Promise.resolve()))
			.then((file) => {
				if (!file) {
					return Promise.resolve();
				}

				const { _id: fileId } = file;
				const newTarget = target.replace(regex, `$1${fileId}$3`);

				console.log(`Replace target of link ${link._id}:`);
				console.log(target);
				console.log('with');
				console.log(newTarget);

				return dry
					? Promise.resolve()
					: LinkModel.update({ _id: link._id }, { target: newTarget }).exec().catch(errorHandler);
			});
	});

	return Promise.all(promises);
};

module.exports = {
	ran,
	name,
	run,
};
