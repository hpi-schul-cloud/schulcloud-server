'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
	username: {type: String, required: true},
	password: {type: String},

	token: {type: String},
	credentialHash: {type: String},

	userId: {type: Schema.Types.ObjectId, ref: 'user'},
	systemId: {type: Schema.Types.ObjectId, ref: 'system'}, // if systemId => SSO

	oaClientId: {type: String}, // just for oauth2-systems
	oaClientSecret: {type: String}, // just for oauth2-systems

	expiresAt: {type: Date},

	activated: {type: Boolean, 'default': false}
},{
	timestamps: true
});

const accountModel = mongoose.model('account', accountSchema);

module.exports = accountModel;
