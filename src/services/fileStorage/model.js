const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const { enableAuditLog } = require('../../utils/database');

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
	{ _id: false }
);

enableAuditLog(permissionSchema);

const SecurityCheckStatusTypes = Object.freeze({
	PENDING: 'pending',
	VERIFIED: 'verified',
	BLOCKED: 'blocked',
	WONTCHECK: 'wont-check',
});

/**
 * handles meta-data for a file
 * @param isDirectory {Boolean} - is this a directory
 * @param name {String} - the name of the file, e.g. cloudy_pastel.jpeg
 * @param size {Number} - the size of the file in byte
 * @param type {String} - the type of the file, e.g. mime/image
 * @param storageFileName {String} - the name of the real file on the storage
 * @param thumbnail {String} - the url of the file's thumbnail image
 * @param thumbnailRequestToken {String} - a UUID to be used to identify a file to a thumbnail generation service
 * @param securityCheck.status {String} - status of the check (see SecurityCheckStatusTypes)
 * @param securityCheck.reason {String} - reason for the status
 * @param securityCheck.requestToken {String} - a UUID to be used to identify the file
 * @param securityCheck.createdAt {Date} - when the security check was requested (usually the file creation date)
 * @param securityCheck.updatedAt {Date} - timestamp of last status change (if any)
 * @param shareToken {String} - hash for enabling sharing. if undefined than sharing is disabled
 * @param parent {File} - parent directory
 * @param owner {User|Course|Team} - owner Object of file
 * @param creator {ObjectId} - ID of the creator (user that uploaded the file, if applicable)
 * @param permissions [Permission] - given permission for this file
 * @param lockId {ObjectId} - indicates whether a file is locked for editing or not (wopi-related)
 */
const fileSchema = new Schema({
	isDirectory: { type: Boolean, default: false }, // should be required
	name: { type: String, required: true },
	size: {
		type: Number,
		required() {
			return !this.isDirectory;
		},
	},
	type: { type: String }, // todo add required but then wopi fails
	storageFileName: {
		type: String,
		required() {
			return !this.isDirectory;
		},
	},
	bucket: { type: String },
	thumbnail: { type: String },
	thumbnailRequestToken: { type: String, default: uuidv4 },
	securityCheck: {
		status: {
			type: String,
			enum: Object.values(SecurityCheckStatusTypes),
			default: SecurityCheckStatusTypes.PENDING,
		},
		reason: { type: String, default: 'not yet scanned' },
		requestToken: { type: String, default: uuidv4 },
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	},
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
	creator: {
		type: Schema.Types.ObjectId,
		ref: 'user',
	},
	permissions: [permissionSchema],
	lockId: { type: Schema.Types.ObjectId, ref: 'user' },
	deletedAt: { type: Date },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

enableAuditLog(fileSchema);

/*
query list with bigges impact of database load
schulcloud.files               find         {"name": 1, "parent": 1}  -> 1 is split up in parent and name to try it out
*/
fileSchema.index({ parent: 1 }); // ok = 1
fileSchema.index({ creator: 1 }); // ?
// make file-model searchable
fileSchema.index({ name: 'text' }); // ?
// Index on permissions to speed up shared-files queries
fileSchema.index({ 'permissions.refId': 1, 'permissions.refPermModel': 1 }); // ?
// Speed up directory listings
fileSchema.index({ owner: 1, parent: 1 }); // ?

const FileModel = mongoose.model('file', fileSchema);
const FilePermissionModel = mongoose.model('filePermissionModel', permissionSchema);

module.exports = {
	FileModel,
	FileSchema: fileSchema,
	SecurityCheckStatusTypes,
	permissionSchema,
	FilePermissionModel,
};
