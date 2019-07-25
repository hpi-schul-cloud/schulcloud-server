// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');

const { Schema } = mongoose;
const fileStorageTypes = ['awsS3'];

const rssFeedSchema = new Schema({
	url: {
		type: String,
		required: true,
		unique: true,
		sparse: true,
	},
	description: {
		type: String,
		default: '',
	},
	status: {
		type: String,
		default: 'pending',
		enum: ['pending', 'success', 'error'],
	},
});

const customYearSchema = new Schema({
	yearId:	{ type: Schema.Types.ObjectId, ref: 'year', required: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
});

const schoolSchema = new Schema({
	name: { type: String, required: true },
	address: { type: Object },
	fileStorageType: { type: String, enum: fileStorageTypes },
	systems: [{ type: Schema.Types.ObjectId, ref: 'system' }],
	federalState: { type: Schema.Types.ObjectId, ref: 'federalstate' },
	createdAt: { type: Date, default: Date.now },
	ldapSchoolIdentifier: { type: String },
	webUntisIdentifier: { type: String },
	updatedAt: { type: Date, default: Date.now },
	experimental: { type: Boolean, default: false },
	pilot: { type: Boolean, default: false },
	currentYear: { type: Schema.Types.ObjectId, ref: 'year' },
	customYears: [{ type: customYearSchema }],
	logo_dataUrl: { type: String },
	purpose: { type: String },
	rssFeeds: [{ type: rssFeedSchema }],
	features: [{ type: String, enum: ['rocketChat', 'disableStudentTeamCreation'] }],
}, {
	timestamps: true,
});

const yearSchema = new Schema({
	name: {
		type: String, required: true, match: /^[0-9]{4}\/[0-9]{2}$/, unique: true,
	},
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
});

const gradeLevelSchema = new Schema({
	name: { type: String, required: true },
});

const schoolModel = mongoose.model('school', schoolSchema);
const yearModel = mongoose.model('year', yearSchema);
const gradeLevelModel = mongoose.model('gradeLevel', gradeLevelSchema);

module.exports = {
	schoolModel,
	yearModel,
	customYearSchema,
	gradeLevelModel,
	fileStorageTypes,
};
