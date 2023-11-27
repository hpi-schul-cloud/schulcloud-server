// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { getDocumentBaseDir } = require('./logic/school');
const externalSourceSchema = require('../../helper/externalSourceSchema');
const { countySchema } = require('../federalState/countyModel');

const { Schema } = mongoose;
const fileStorageTypes = ['awsS3'];

const SCHOOL_FEATURES = {
	ROCKET_CHAT: 'rocketChat',
	VIDEOCONFERENCE: 'videoconference',
	NEXTCLOUD: 'nextcloud',
	STUDENTVISIBILITY: 'studentVisibility', // deprecated
	LDAP_UNIVENTION_MIGRATION: 'ldapUniventionMigrationSchool',
	OAUTH_PROVISIONING_ENABLED: 'oauthProvisioningEnabled',
	SHOW_OUTDATED_USERS: 'showOutdatedUsers',
	ENABLE_LDAP_SYNC_DURING_MIGRATION: 'enableLdapSyncDuringMigration',
};

const SCHOOL_OF_DELETED_USERS = { name: 'graveyard school (tombstone users only)', purpose: 'tombstone' };

const defaultFeatures = [];

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
	yearId: { type: Schema.Types.ObjectId, ref: 'year', required: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
});

const schoolSchema = new Schema(
	{
		name: { type: String, required: true },
		address: { type: Object },
		fileStorageType: { type: String, enum: fileStorageTypes },
		schoolGroupId: { type: Schema.Types.ObjectId, ref: 'schoolGroup' },
		documentBaseDirType: {
			type: String,
			required: false,
			default: '',
			enum: ['', 'school', 'schoolGroup'],
		},
		officialSchoolNumber: { type: String }, // TODO unique per federal state validation on save
		county: { type: countySchema },
		systems: [{ type: Schema.Types.ObjectId, ref: 'system' }],
		federalState: { type: Schema.Types.ObjectId, ref: 'federalstate' },
		createdAt: { type: Date, default: Date.now },
		ldapSchoolIdentifier: { type: String },
		previousExternalId: { type: String, required: false },
		ldapLastSync: { type: String },
		updatedAt: { type: Date, default: Date.now },
		experimental: { type: Boolean, default: false },
		pilot: { type: Boolean, default: false },
		currentYear: { type: Schema.Types.ObjectId, ref: 'year' },
		customYears: [{ type: customYearSchema }],
		logo_dataUrl: { type: String },
		logo_name: { type: String },
		purpose: { type: String },
		rssFeeds: [{ type: rssFeedSchema }],
		language: { type: String },
		timezone: { type: String },
		features: {
			type: [String],
			default: defaultFeatures,
			enum: Object.values(SCHOOL_FEATURES),
		},
		/**
		 * depending on system settings,
		 * an admin may opt-in or -out,
		 * default=null dependent on STUDENT_TEAM_CREATION
		 */
		enableStudentTeamCreation: { type: Boolean, required: false },
		inMaintenanceSince: { type: Date }, // see schoolSchema#inMaintenance (below),
		inUserMigration: { type: Boolean },
		storageProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'storageprovider' },
		permissions: { type: Object },
		tombstoneUserId: {
			type: Schema.Types.ObjectId,
			ref: 'user',
		},
		...externalSourceSchema,
	},
	{
		timestamps: true,
	}
);

const userLoginMigrationSchema = new Schema({
	school: { type: Schema.Types.ObjectId, ref: 'school', required: true },
	sourceSystem: { type: Schema.Types.ObjectId, ref: 'system' },
	targetSystem: { type: Schema.Types.ObjectId, ref: 'system', required: true },
	mandatorySince: { type: Date },
	startedAt: { type: Date, required: true },
	closedAt: { type: Date },
	finishedAt: { type: Date },
});

// don't exists in new entity
schoolSchema.index({ purpose: 1 });

if (Configuration.get('FEATURE_TSP_ENABLED') === true) {
	// to speed up lookups during TSP sync
	schoolSchema.index({ 'sourceOptions.$**': 1 }); // need we it??
}

const schoolGroupSchema = new Schema(
	{
		name: { type: String, required: true },
	},
	{ timestamps: true }
);

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

schoolSchema.virtual('isExternal').get(function get() {
	return !!this.ldapSchoolIdentifier || !!this.source;
});

schoolSchema.virtual('userLoginMigration', {
	ref: 'userLoginMigration',
	localField: '_id',
	foreignField: 'school',
	justOne: true,
});

const yearSchema = new Schema({
	name: {
		type: String,
		required: true,
		match: /^[0-9]{4}\/[0-9]{2}$/,
		unique: true,
	},
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
});

const gradeLevelSchema = new Schema({
	name: { type: String, required: true },
});

const schoolModel = mongoose.model('school', schoolSchema);
const userLoginMigrationModel = mongoose.model('userLoginMigration', userLoginMigrationSchema, 'user-login-migrations');
const schoolGroupModel = mongoose.model('schoolGroup', schoolGroupSchema);
const yearModel = mongoose.model('year', yearSchema);
const gradeLevelModel = mongoose.model('gradeLevel', gradeLevelSchema);

module.exports = {
	SCHOOL_FEATURES,
	SCHOOL_OF_DELETED_USERS,
	schoolSchema,
	schoolModel,
	schoolGroupModel,
	yearModel,
	customYearSchema,
	gradeLevelModel,
	fileStorageTypes,
	userLoginMigrationSchema,
	userLoginMigrationModel,
};
