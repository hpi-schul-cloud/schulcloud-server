'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
	username: {type: String, required: true},
	userId: {type: Schema.Types.ObjectId, required: true},
	token: {type: String, required: false},
	credentialHash: {type: String},
	password: {type: String},

	schoolId: {type: Schema.Types.ObjectId /*, required: true*/},
	systemId: {type: Schema.Types.ObjectId, required: true},

	expiresAt: {type: Date}
},{
	timestamps: true
});

const accountModel = mongoose.model('account', accountSchema);

module.exports = accountModel;
