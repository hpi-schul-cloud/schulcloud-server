const mongoose = require('mongoose');
const uuid = require('uuid/v4');

const { Schema } = mongoose;

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
	{ _id: false },
);

/**
 * handles meta-data for a file
 * @param isDirectory {Boolean} - is this a directory
 * @param name {String} - the name of the file, e.g. cloudy_pastel.jpeg
 * @param size {Number} - the size of the file in byte
 * @param type {String} - the type of the file, e.g. mime/image
 * @param storageFileName {String} - the name of the real file on the storage
 * @param thumbnail {String} - the url of the file's thumbnail image
 * @param shareToken {String} - hash for enabling sharing. if undefined than sharing is disabled
 * @param parent {File} - parent directory
 * @param owner {User|Course|Team} - owner Object of file
 * @param permissions [Permission] - given permission for this file
 * @param lockId {ObjectId} - indicates whether a file is locked for editing or not (wopi-related)
 */
const fileSchema = new Schema({
	isDirectory: { type: Boolean, default: false },
	name: { type: String },
	size: { type: Number },
	type: { type: String },
	storageFileName: { type: String },
	thumbnail: { type: String },
	thumbnailRequestToken: { type: String, default: uuid },
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

// make file-model searchable
fileSchema.index({ name: 'text' });

module.exports = {
	FileModel: mongoose.model('file', fileSchema),
	permissionSchema,
};
