'use strict';

// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileStorageTypes = ['awsS3'];

const schoolSchema = new Schema({
	name: {type: String, required: true},
	address: {type: Object},
	fileStorageType: {type: String, enum: fileStorageTypes},
	systems: [{type: Schema.Types.ObjectId, ref: 'system'}],
	ldapConfig: {type: Schema.Types.ObjectId, ref: 'ldapconfig'},
	ldapSchoolIdentifier: {type: String},
	federalState: {type: Schema.Types.ObjectId, ref: 'federalstate'},
	createdAt: {type: Date, 'default': Date.now},
	updatedAt: {type: Date, 'default': Date.now},
	experimental: {type: Boolean, 'default': false},
	pilot: {type: Boolean, 'default': false},
	currentYear: {type: Schema.Types.ObjectId, ref:'year'}
},{
	timestamps: true
});

const yearSchema = new Schema({
	name: {type: String, required: true}
});

const gradeLevelSchema = new Schema({
	name: {type: String, required: true}
});

const schoolModel = mongoose.model('school', schoolSchema);
const yearModel = mongoose.model('year', yearSchema);
const gradeLevelModel = mongoose.model('gradeLevel', gradeLevelSchema);

module.exports = {
	schoolModel,
	yearModel,
	gradeLevelModel
};
