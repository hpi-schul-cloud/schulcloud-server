// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const { getDocumentBaseDir } = require('./logic/school');
const { enableAuditLog } = require('../../utils/database');
const externalSourceSchema = require('../../helper/externalSourceSchema');
const { STUDENT_TEAM_CREATE_DISABLED } = require('../../../config/globals');

const { Schema } = mongoose;
const fileStorageTypes = ['awsS3'];

const defaultFeatures = [];
if (STUDENT_TEAM_CREATE_DISABLED === 'true'
	|| STUDENT_TEAM_CREATE_DISABLED === '1') {
	defaultFeatures.push('disableStudentTeamCreation');
}

const SCHOOL_FEATURES = {
	ROCKET_CHAT: 'rocketChat',
	DISABLE_STUDENT_TEAM_CREATION: 'disableStudentTeamCreation',
	VIDEOCONFERENCE: 'videoconference',
};

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
enableAuditLog(rssFeedSchema);

const customYearSchema = new Schema({
	yearId: { type: Schema.Types.ObjectId, ref: 'year', required: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
});

const schoolSchema = new Schema({
	name: { type: String, required: true },
	address: { type: Object },
	fileStorageType: { type: String, enum: fileStorageTypes },
	storageProvider: { type: Schema.Types.ObjectId, ref: 'storageProvider' },
	schoolGroupId: { type: Schema.Types.ObjectId, ref: 'schoolGroup' },
	documentBaseDirType: {
		type: String,
		required: false,
		default: '',
		enum: ['', 'school', 'schoolGroup'],
	},
	systems: [{ type: Schema.Types.ObjectId, ref: 'system' }],
	federalState: { type: Schema.Types.ObjectId, ref: 'federalstate' },
	createdAt: { type: Date, default: Date.now },
	ldapSchoolIdentifier: { type: String },
	updatedAt: { type: Date, default: Date.now },
	experimental: { type: Boolean, default: false },
	pilot: { type: Boolean, default: false },
	currentYear: { type: Schema.Types.ObjectId, ref: 'year' },
	customYears: [{ type: customYearSchema }],
	logo_dataUrl: { type: String },
	purpose: { type: String },
	rssFeeds: [{ type: rssFeedSchema }],
	features: {
		type: [String],
		default: defaultFeatures,
		enum: Object.values(SCHOOL_FEATURES),
	},
	inMaintenanceSince: { type: Date }, // see schoolSchema#inMaintenance (below)
	...externalSourceSchema,
}, {
	timestamps: true,
});


const schoolGroupSchema = new Schema({
	name: { type: String, required: true },
}, { timestamps: true });


/**
 * Determine if school is in maintenance mode ("Schuljahreswechsel"):
 * 		inMaintenanceSince not set: maintenance mode is disabled (false)
 * 		inMaintenanceSince <  Date.now(): maintenance will be enabled at this date in the future (false)
 * 		inMaintenanceSince >= Date.now(): maintenance mode is enabled (true)
 */
schoolSchema.plugin(require('mongoose-lean-virtuals'));

schoolSchema.virtual('inMaintenance').get(function get() {
	return Boolean(this.inMaintenanceSince && this.inMaintenanceSince <= Date.now());
});

schoolSchema.virtual('documentBaseDir').get(function get() {
	const school = this;
	return getDocumentBaseDir(school);
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

enableAuditLog(schoolSchema);
enableAuditLog(schoolGroupSchema);
enableAuditLog(yearSchema);
enableAuditLog(gradeLevelSchema);

const schoolModel = mongoose.model('school', schoolSchema);
const schoolGroupModel = mongoose.model('schoolGroup', schoolGroupSchema);
const yearModel = mongoose.model('year', yearSchema);
const gradeLevelModel = mongoose.model('gradeLevel', gradeLevelSchema);

module.exports = {
	SCHOOL_FEATURES,
	schoolModel,
	schoolGroupModel,
	yearModel,
	customYearSchema,
	gradeLevelModel,
	fileStorageTypes,
};
