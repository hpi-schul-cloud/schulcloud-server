/* eslint no-console: 0 */
/* eslint no-confusing-arrow: 0 */
const chalk = require('chalk');

const ran = true; // set to true to exclude migration
const name = 'Migrating new file model';

const mongoose = require('mongoose');
const database = require('../../src/utils/database');

const { Schema } = mongoose;

const RoleModel = require('../../src/services/role/model.js');

mongoose.Promise = global.Promise;

const sanitizeObj = (obj) => {
	Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
	return obj;
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

const oldDirectorySchema = new Schema({
	key: { type: String, required: true, unique: true },
	path: { type: String },
	name: { type: String },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

const permissionSchema = new Schema(
	{
		refId: {
			type: Schema.Types.ObjectId,
			refPath: 'refPermModel',
		},
		refPermModel: {
			type: String,
			enum: ['user', 'role'],
		},
		write: { type: Boolean, default: true },
		read: { type: Boolean, default: true },
		create: { type: Boolean, default: true },
		delete: { type: Boolean, default: true },
	},
	{ _id: false }
);

const fileSchema = new Schema({
	isDirectory: { type: Boolean, default: false },
	name: { type: String },
	size: { type: Number },
	type: { type: String },
	storageFileName: { type: String },
	thumbnail: { type: String },
	shareToken: { type: String },
	parent: { type: Schema.Types.ObjectId, ref: 'file' },
	owner: {
		type: Schema.Types.ObjectId,
		required: true,
		refPath: 'refOwnerModel',
	},
	refOwnerModel: {
		type: String,
		required: true,
		enum: ['user', 'course', 'teams'],
	},
	permissions: [permissionSchema],
	lockId: { type: Schema.Types.ObjectId, ref: 'user' },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

const run = async (dry) => {
	database.connect();

	const oldfileModel = mongoose.model('oldfile', oldFileSchema, '_files');
	const directoryModel = mongoose.model('directory', oldDirectorySchema);
	const FileModel = mongoose.model('file', fileSchema, 'files');

	const { _id: studentRoleId } = await RoleModel.findOne({ name: 'student' }).exec();
	const { _id: teacherRoleId } = await RoleModel.findOne({ name: 'teacher' }).exec();

	const logGreen = (obj) => {
		if (dry) {
			console.log(chalk.green(obj));
		}
	};

	const convertDocument = (doc) => {
		logGreen(`Converting document ${doc.name} with path ${doc.path}`);

		const [refOwnerModel, owner] = doc.key.split('/');

		const refOwnerModelMap = {
			users: 'user',
			courses: 'course',
		};

		let permissions = [];

		if (refOwnerModel === 'users') {
			permissions.push({
				refId: owner,
				refPermModel: 'user',
				write: true,
				read: true,
				create: true,
				delete: true,
			});
		} else if (refOwnerModel === 'courses') {
			permissions.push({
				refId: studentRoleId,
				refPermModel: 'role',
				write: doc.studentCanEdit,
				read: true,
				create: false,
				delete: false,
			});
			permissions.push({
				refId: teacherRoleId,
				refPermModel: 'role',
				write: true,
				read: true,
				create: true,
				delete: true,
			});
		}

		if (doc.permissions && doc.permissions.length) {
			permissions = [
				...permissions,
				...doc.permissions.map((perm) => ({
					refId: perm.userId,
					refPermModel: 'user',
					write: perm.permissions.indexOf('can-write') > -1,
					read: perm.permissions.indexOf('can-read') > -1,
					create: false,
					delete: false,
				})),
			];
		}

		// Props obsolete in new model
		const nullers = {
			__v: undefined,
			key: undefined,
			path: undefined,
			schoolId: undefined,
			flatFileName: undefined,
		};

		return sanitizeObj({
			...doc,
			isDirectory: !doc.type,
			refOwnerModel: refOwnerModelMap[refOwnerModel] || refOwnerModel,
			owner,
			storageFileName: doc.flatFileName,
			permissions,
			...nullers,
		});
	};

	const spawnDocuments = (directories, parent) => {
		let transformed = directories.map(convertDocument);

		if (parent) {
			transformed = transformed.map((doc) => ({ ...doc, parent }));
		}

		const promises = transformed.map(async (d) => {
			if (dry) {
				return d;
			}
			const fileObject = await FileModel.findOne({ _id: d._id }).exec();

			if (fileObject) {
				const newId = mongoose.Types.ObjectId();
				console.log(`Remove duplicate ID ${d._id} with ${newId}`);
				d._id = newId;
			}

			return FileModel.create(d);
		});

		return Promise.all(promises);
	};

	const rootDocument = (docs) => {
		const splitPath = docs.path.split('/').filter((chunk) => !!chunk);
		return splitPath.length === 2;
	};

	const resolveChildren = ({ subset, documents, parent }) =>
		spawnDocuments(subset, parent).then((result) => {
			const childPromises = subset.map((document, index) => {
				const children = documents.filter((d) => d.path.slice(0, -1) === document.key);

				if (children.length) {
					return resolveChildren({
						subset: children,
						documents,
						parent: result[index]._id,
					});
				}
				return true;
			});

			return Promise.all(childPromises);
		});

	logGreen('Migrating directories and files');

	const directories = await directoryModel.find({}).lean().exec();
	const files = await oldfileModel.find({}).lean().exec();
	const merged = [...directories, ...files];

	const rootDocs = merged.filter(rootDocument);

	return resolveChildren({ subset: rootDocs, documents: merged });
};

module.exports = {
	ran,
	name,
	run,
};
