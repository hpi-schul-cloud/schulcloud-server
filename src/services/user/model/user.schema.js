const mongoose = require('mongoose');
const leanVirtuals = require('mongoose-lean-virtuals');
const { Configuration } = require('@hpi-schul-cloud/commons');
const mongooseHistory = require('mongoose-history');
const roleModel = require('../../role/model');
const { enableAuditLog } = require('../../../utils/database');
const { splitForSearchIndexes } = require('../../../utils/search');
const externalSourceSchema = require('../../../helper/externalSourceSchema');

const { Schema } = mongoose;

const defaultFeatures = [];
const USER_FEATURES = {
	EDTR: 'edtr',
};

const consentForm = ['analog', 'digital', 'update'];
const consentTypes = {
	PRIVACY: 'privacy',
	TERMS_OF_USE: 'termsOfUse',
};

const userSchema = new Schema(
	{
		roles: [{ type: Schema.Types.ObjectId, ref: 'role' }],
		email: { type: String, required: true, lowercase: true },
		emailSearchValues: { type: Schema.Types.Array },

		schoolId: {
			type: Schema.Types.ObjectId,
			ref: 'school',
			required: true,
		},

		firstName: { type: String, required: true },
		firstNameSearchValues: { type: Schema.Types.Array },
		middleName: { type: String },
		lastName: { type: String, required: true },
		lastNameSearchValues: { type: Schema.Types.Array },
		namePrefix: { type: String },
		nameSuffix: { type: String },
		forcePasswordChange: { type: Boolean, default: false },

		birthday: { type: Date },

		importHash: { type: String },
		// inviteHash:{type:String},
		parents: [
			{
				_id: false,
				firstName: { type: String, required: true },
				lastName: { type: String, required: true },
				email: { type: String, required: true, lowercase: true },
			},
		],
		language: { type: String },
		preferences: { type: Object }, // blackbox for frontend stuff like "cookies accepted"
		features: {
			type: [String],
			default: defaultFeatures,
			enum: Object.values(USER_FEATURES),
		},

		consent: {
			userConsent: {
				form: { type: String, enum: consentForm },
				dateOfPrivacyConsent: { type: Date },
				dateOfTermsOfUseConsent: { type: Date },
				privacyConsent: { type: Boolean },
				termsOfUseConsent: { type: Boolean },
			},
			parentConsents: [
				{
					form: { type: String, enum: consentForm },
					dateOfPrivacyConsent: { type: Date },
					dateOfTermsOfUseConsent: { type: Date },
					privacyConsent: { type: Boolean },
					termsOfUseConsent: { type: Boolean },
				},
			],
			consentVersionUpdated: {
				type: 'string',
				enum: ['all', 'dateOfPrivacyConsent', 'dateOfTermsOfUseConsent'],
			},
		},

		/**
		 * depending on system settings,
		 * a user may opt-in or -out,
		 * default=null should use TEAM_INVITATION_DEFAULT_VISIBILITY_FOR_TEACHERS instead
		 */
		discoverable: { type: Boolean, required: false },

		// optional attributes if user was created during LDAP sync:
		ldapDn: { type: String }, // LDAP login username
		ldapId: { type: String }, // UUID to identify during the sync

		...externalSourceSchema,

		customAvatarBackgroundColor: { type: String },
		avatarSettings: { type: Object },
		deletedAt: { type: Date, default: null },
	},
	{
		timestamps: true,
	}
);
/*
query list with biggest impact of database load
schulcloud.users               find         {"importHash": 1}  -> 1
schulcloud.users               find         {"email": 1}   -> 2
schulcloud.users               find         {"_id": {"$ne": 1}, "email": 1} -> 3
schulcloud.users               find         {"_id": 1} -> 4 ok
schulcloud.users               find         {"firstName": 1, "lastName": 1} -> 5
*/

userSchema.index({ importHash: 1 }); // ok = 1
userSchema.index({ email: 1 }); // ok = 2
userSchema.index({ _id: 1, email: 1 }); // ok = 2
userSchema.index({ firstName: 1, lastName: 1 }); // ok = 5

userSchema.index({ ldapDn: 1 }); // ?
userSchema.index({ ldapId: 1 }); // ?
userSchema.index({ ldapId: 1, schoolId: 1 }); // ?
userSchema.index({ schoolId: 1 }); // ?

userSchema.index({ schoolId: 1, roles: -1 }); // ?
userSchema.index(
	{
		firstName: 'text',
		lastName: 'text',
		email: 'text',
		firstNameSearchValues: 'text',
		lastNameSearchValues: 'text',
		emailSearchValues: 'text',
	},
	{
		weights: {
			firstName: 15,
			lastName: 15,
			email: 15,
			firstNameSearchValues: 3,
			lastNameSearchValues: 3,
			emailSearchValues: 2,
		},
		name: 'userSearchIndex',
		default_language: 'none', // no stop words and no stemming,
		language_override: 'de',
	}
); // ?
// maybe the schoolId index is enough ?
// https://ticketsystem.schul-cloud.org/browse/SC-3724

if (Configuration.get('FEATURE_TSP_ENABLED') === true) {
	// to speed up lookups during TSP sync
	userSchema.index({ 'sourceOptions.$**': 1 });
}

// This 'pre-save' method slices the firstName, lastName and email
// To allow searching the users
function buildSearchIndexOnSave() {
	this.firstNameSearchValues = splitForSearchIndexes(this.firstName);
	this.lastNameSearchValues = splitForSearchIndexes(this.lastName);
	this.emailSearchValues = splitForSearchIndexes(this.email);
}
function buildSearchIndexOnUpdate() {
	const data = this.getUpdate() || {};
	if (data.firstName && !data.firstNameSearchValues) data.firstNameSearchValues = splitForSearchIndexes(data.firstName);
	if (data.lastName && !data.lastNameSearchValues) data.lastNameSearchValues = splitForSearchIndexes(data.lastName);
	if (data.email && !data.emailSearchValues) data.emailSearchValues = splitForSearchIndexes(data.email);
}
userSchema.pre('save', buildSearchIndexOnSave);
userSchema.pre('update', buildSearchIndexOnUpdate);
userSchema.pre('updateOne', buildSearchIndexOnUpdate);
userSchema.pre('updateMany', buildSearchIndexOnUpdate);
userSchema.pre('findOneAndUpdate', buildSearchIndexOnUpdate);

userSchema.virtual('fullName').get(function get() {
	return [this.namePrefix, this.firstName, this.middleName, this.lastName, this.nameSuffix]
		.join(' ')
		.trim()
		.replace(/\s+/g, ' ');
});

userSchema.plugin(leanVirtuals);

userSchema.methods.getPermissions = function getPermissions() {
	return roleModel.resolvePermissions(this.roles);
};

enableAuditLog(userSchema);
userSchema.plugin(mongooseHistory);

module.exports = {
	USER_FEATURES,
	userSchema,
	consentTypes,
};
