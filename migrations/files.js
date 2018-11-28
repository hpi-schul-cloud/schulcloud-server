const ran = false;
const name = 'Migrating new file model';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect(process.env.DB_URL || 'mongodb://localhost:27017/schulcloud', {user:process.env.DB_USERNAME, pass:process.env.DB_PASSWORD});

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

const FileModel = mongoose.model('file', fileSchema);

const run = async (dry) => {
	const directories = await directoryModel.find({}).exec();
	const createDirectoriesByPath = (data) => {
		const { path: [dir, ...rest]} = data;

		if(dir) {

			FileModel.find({
				owner: data.owner,
				name: dir
			}).exec().then(res => {
				if(!res.length) {

				}
			});
		}

		return Promise.resolve(data);
	};

	directories.forEach(dir => {
		const [refOwnerModel, owner, ...rest] = dir.key.split('/');
		const dirs = rest.filter(path => Boolean(path));
		const { name, updatedAt, createdAt } = dir;
		const data = {
			isDirectory: true,
			refOwnerModel,
			owner,
			updatedAt,
			createdAt,
			path: rest
		};

		createDirectoriesByPath(data).then((data) => {
			console.log(data);
		});

	});
};

module.exports = {
	ran,
	name,
	run
};
