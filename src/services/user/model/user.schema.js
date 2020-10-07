const mongoose = require('mongoose');
const leanVirtuals = require('mongoose-lean-virtuals');
const { Configuration } = require('@schul-cloud/commons');
const mongooseHistory = require('mongoose-history');
const roleModel = require('../../role/model');
const { enableAuditLog } = require('../../../utils/database');
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

		schoolId: {
			type: Schema.Types.ObjectId,
			ref: 'school',
			required: true,
			index: true,
		},

		firstName: { type: String, required: true },
		middleName: { type: String },
		lastName: { type: String, required: true },
		namePrefix: { type: String },
		nameSuffix: { type: String },
		searchIndexes: { type: Schema.Types.Array },
		forcePasswordChange: { type: Boolean, default: false },

		birthday: { type: Date },

		importHash: { type: String, index: true },
		// inviteHash:{type:String},

		children: [{ type: Schema.Types.ObjectId, ref: 'user' }],
		parents: [{ type: Schema.Types.ObjectId, ref: 'user' }],
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
					parentId: { type: Schema.Types.ObjectId, ref: 'user' },
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
		ldapDn: { type: String, index: true }, // LDAP login username
		ldapId: { type: String, index: true }, // UUID to identify during the sync

		...externalSourceSchema,

		customAvatarBackgroundColor: { type: String },
		avatarSettings: { type: Object },
	},
	{
		timestamps: true,
	}
);

userSchema.index({ schoolId: 1, roles: -1 });
userSchema.index({ firstName: 'text', lastName: 'text', email: 'text', searchIndexes: 'text' });
// maybe the schoolId index is enough ?
// https://ticketsystem.schul-cloud.org/browse/SC-3724

if (Configuration.get('FEATURE_TSP_ENABLED') === true) {
	// to speed up lookups during TSP sync
	userSchema.index({ 'sourceOptions.$**': 1 });
}

// This 'pre-save' method slices the firstName, lastName and email
// To allow searching the users
userSchema.pre('save', function() {
	const arr = [];
	const firstName = this.firstName.replace(/\s/g,'');
	const lastName = this.lastName.replace(/\s/g,'');
	const email = this.email.replace(/\s/g,'');
	
	for (i = 0; i < firstName.length - 2; i++) arr.push(firstName.slice(i, i + 3));
	for (i = 0; i < lastName.length - 2; i++) arr.push(lastName.slice(i, i + 3));
	for (i = 0; i < email.length - 2; i++) arr.push(email.slice(i, i + 3));

	this.searchIndexes = arr;
});

  

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
