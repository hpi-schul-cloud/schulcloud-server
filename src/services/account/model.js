'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
	username: {type: String, required: true},
	password: {type: String},

	token: {type: String},
	credentialHash: {type: String},

	userId: {type: Schema.Types.ObjectId},
	systemId: {type: Schema.Types.ObjectId}, // if systemId => SSO

	expiresAt: {type: Date}
},{
	timestamps: true
});

const accountModel = mongoose.model('account', accountSchema);

module.exports = accountModel;
