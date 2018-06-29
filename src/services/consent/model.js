'use strict';

// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const consentSchema = new Schema({
	userId: {type: Schema.Types.ObjectId, ref: 'user', required: true},
	name: {type: String},
	dateOfConsent: {type: Date, 'default': Date.now},
	parentName: {type: String},
	dateOfParentConsent: {type: Date, 'default': Date.now}
});

const consentVersionSchema = new Schema({
	consentText: {type: String},
	date: {type: Date}
});

const consentModel = mongoose.model('consent', consentSchema);
const consentVersionModel = mongoose.model('consentVersion', consentVersionSchema);

module.exports = {
	consentModel,
	consentVersionModel
};
