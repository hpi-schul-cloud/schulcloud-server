'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const permissionTypes = ['can-read', 'can-write'];

/**
 * handles meta-data for a file
 * @param key {String} - the key/path to the file, e.g. users/0000d231816abba584714c9e/cloudy_pastel.jpeg
 * Information: key could be redundant because it is just path + name, but it is easier to handle different server calls
 * @param path {String} - the path in which the file exists users/0000d231816abba584714c9e/
 * @param name {String} - the name of the file, e.g. cloudy_pastel.jpeg
 * @param size {Number} - the size of the file in byte
 * @param type {String} - the type of the file, e.g. mime/image
 * @param thumbnail {String} - the url of the file's thumbnail image
 * @param permissions [Permission] - given extra permission for this file (except the normal permissions)
 */
const fileSchema = new Schema({
	key: {type: String, required: true, unique: true},
	path: {type: String},
	name: {type: String},
	size: {type: Number},
	type: {type: String},
	thumbnail: {type: String},
	permissions: [{
		userId: {type: Schema.Types.ObjectId, ref: 'user'},
		permissions: [{type: String, enum: permissionTypes}]
	}],
	createdAt: {type: Date, 'default': Date.now},
	updatedAt: {type: Date, 'default': Date.now}
});

/**
 * handles meta-data for a directory
 * @param key {String} - the key/path to the directory, e.g. users/0000d231816abba584714c9e/folder
 * @param directories [Directory] - the sub-directories
 * @param files [File] - the files in the given directory
 */
const directorySchema = new Schema({
	key: {type: String, required: true, unique: true},
	directories: [{type: Schema.Types.ObjectId, required: true, ref: 'directory'}],
	files: [{type: Schema.Types.ObjectId, required: true, ref: 'file'}],
	createdAt: {type: Date, 'default': Date.now},
	updatedAt: {type: Date, 'default': Date.now}
});

const fileModel = mongoose.model('file', fileSchema);
const directoryModel = mongoose.model('directory', directorySchema);

module.exports = { fileModel, directoryModel };
