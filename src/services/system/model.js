'use strict';

// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const types = ['moodle', 'itslearning', 'lernsax', 'iserv', 'local', 'ldap'];

const systemSchema = new Schema({
	type: { type: String, required: true, enum: types },
	url: { type: String, required: false },
	alias: { type: String },
	oaClientId: { type: String }, // just for oauth2-systems
	oaClientSecret: { type: String }, // just for oauth2-systems
	ldapConfig: {
		url: { type: String },
		rootPath: { type: String },
		searchUser: { type: String },
		searchUserPassword: { type: String },
		provider: { type: String },
		importUser: { type: String },
		importUserPassword: { type: String },
		importUrl: { type: String },
	},
}, {
	timestamps: true
});

const systemModel = mongoose.model('system', systemSchema);

module.exports = systemModel;
