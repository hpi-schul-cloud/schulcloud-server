'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const permissionTypes = ['can-read', 'can-write'];

/**
 * handles multiple permissions for a file, etc. for file sharing
 * @param key {String} - the key/path to the file
 * @param permissions [Permission] - given extra permission for this file (except the normal permissions)
 */
const filePermissionSchema = new Schema({
	key: {type: String, required: true, unique : true},
	permissions: [{
		userId: {type: Schema.Types.ObjectId, ref: 'user'},
		permissions: [{type: String, enum: permissionTypes}]
	}],
	createdAt: {type: Date, 'default': Date.now},
	updatedAt: {type: Date, 'default': Date.now}
});

const filePermissionModel = mongoose.model('filePermission', filePermissionSchema);

module.exports = filePermissionModel;
