/*eslint no-console: 0 */
const chalk = require('chalk');

const ran = false;
const name = 'Migrating new file model';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

mongoose.connect(process.env.DB_URL || 'mongodb://localhost:27017/schulcloud', {user:process.env.DB_USERNAME, pass:process.env.DB_PASSWORD});

const sanitizeObj = obj => {
	Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
	return obj;
};

const permissionTypes = ['can-read', 'can-write'];

const oldFileSchema = new Schema({
	key: {type: String, required: true, unique: true},
	path: {type: String},
	name: {type: String},
	size: {type: Number},
	type: {type: String},
	flatFileName: {type: String},
	thumbnail: {type: String},
	permissions: [{
		userId: {type: Schema.Types.ObjectId, ref: 'user'},
		permissions: [{type: String, enum: permissionTypes}]
	}],
	lockId: {type: Schema.Types.ObjectId},
	shareToken: {type: String},
	schoolId: {type: Schema.Types.ObjectId, ref: 'school'},
	studentCanEdit: {type: Boolean, default: false} ,
	createdAt: {type: Date, 'default': Date.now},
	updatedAt: {type: Date, 'default': Date.now}
});

const oldDirectorySchema = new Schema({
	key: {type: String, required: true, unique: true},
	path: {type: String},
	name: {type: String},
	createdAt: {type: Date, 'default': Date.now},
	updatedAt: {type: Date, 'default': Date.now}
});

const oldfileModel = mongoose.model('oldfile', oldFileSchema, '_files');
const directoryModel = mongoose.model('directory', oldDirectorySchema);

const permissionSchema = new Schema({
	refId: {
		type: Schema.Types.ObjectId,
		refPath: 'refPermModel'
	},
	refPermModel: {
		type: String,
		enum: ['user', 'role']
	},
	write: { type: Boolean, default: true },
	read: { type: Boolean, default: true },
	create: { type: Boolean, default: true },
	delete: { type: Boolean, default: true },
}, { _id: false});

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
		refPath: 'refOwnerModel'
	},
	refOwnerModel: {
		type: String,
		required: true,
		enum: ['user', 'course', 'teams']
	},
	permissions: [permissionSchema],
	lockId: { type: Schema.Types.ObjectId, ref: 'user' },
	createdAt: { type: Date, 'default': Date.now },
	updatedAt: { type: Date, 'default': Date.now }
});

const FileModel = mongoose.model('file', fileSchema, 'files');

const run = async (dry) => {

	const logGreen = obj => {
		if( dry ) {
			console.log(chalk.green(obj));
		}
	};

	const convertDocument = doc => {
		logGreen(`Converting document ${doc.name} with path ${doc.path}`);

		const [refOwnerModel, owner, ] = doc.key.split('/');
		const refOwnerModelMap = {
			'users': 'user',
			'courses': 'course',
		};

		// Props obsolete in new model
		const nullers = {
			_id: undefined,
			__v: undefined,
			key: undefined,
			path: undefined,
			schoolId: undefined,
			flatFileName: undefined
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

	const spawnDocuments = (directories, parent) => {
		let transformed = directories.map(convertDocument);

		if( parent ) {
			transformed = transformed.map(doc => ({...doc, parent}));
		}

		const promises = transformed.map(d => FileModel.create(d));

		return Promise.all(promises);
	};

	const rootDocument = docs => {
		const splitPath = docs.path.split('/').filter(chunk => !!chunk);
		return splitPath.length === 2;
	};

	const resolveChildren = ({ subset, documents, parent }) => {

		return spawnDocuments(subset, parent).then((result) => {

			const childPromises = subset.map((document, index) => {

				const children = documents.filter(d => d.path.slice(0, -1) === document.key);

				if( children.length ) {
					return resolveChildren({
						subset: children,
						documents,
						parent: result[index]._id
					});
				}
				return true;
			});

			return Promise.all(childPromises);
		});
	};

	logGreen('Migrating directories and files');

	const directories = await directoryModel.find({}).lean().exec();
	const files = await oldfileModel.find({}).lean().exec();
	const merged = [...directories, ...files];

	const rootDocs = merged.filter(rootDocument);

	resolveChildren({subset: rootDocs, documents: merged}).then(() => {
		logGreen('Finished');
		process.exit(0);
	});

};

module.exports = {
	ran,
	name,
	run
};
