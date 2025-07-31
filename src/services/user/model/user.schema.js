const mongoose = require('mongoose');
const leanVirtuals = require('mongoose-lean-virtuals');
const roleModel = require('../../role/model');
const { buildAllSearchableStringsForUser } = require('../../../utils/search');
const externalSourceSchema = require('../../../helper/externalSourceSchema');

const { Schema } = mongoose;

const defaultFeatures = [];

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
		},

		firstName: { type: String, required: true },
		preferredName: { type: String },
		middleName: { type: String },
		lastName: { type: String, required: true },
		allSearchableStrings: { type: Schema.Types.Array },
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
		lastLoginSystemChange: { type: Date },
		outdatedSince: { type: Date },
		/**
		 * depending on system settings,
		 * a user may opt-in or -out,
		 * default=null should use TEAM_INVITATION_DEFAULT_VISIBILITY_FOR_TEACHERS instead
		 */
		discoverable: { type: Boolean, required: false },

		// optional attributes if user was created during LDAP sync:
		ldapDn: { type: String }, // LDAP login username
		ldapId: { type: String }, // UUID to identify during the sync
		previousExternalId: { type: String }, // the former ldapId after oauth migrated user

		lastSyncedAt: { type: Date }, // date of the last user data sync

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

// maybe the schoolId index is enough ?
// https://ticketsystem.dbildungscloud.de/browse/SC-3724

// This 'pre-save' method slices the firstName, lastName and email
// To allow searching the users
function buildSearchIndexOnSave() {
	this.allSearchableStrings = buildAllSearchableStringsForUser(this.firstName, this.lastName, this.email);
}
function buildSearchIndexOnUpdate() {
	const data = this.getUpdate() || {};
	if (data.firstName || data.lastName || data.email) {
		data.allSearchableStrings = buildAllSearchableStringsForUser(data.firstName, data.lastName, data.email);
	}
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

module.exports = {
	userSchema,
	consentTypes,
};
