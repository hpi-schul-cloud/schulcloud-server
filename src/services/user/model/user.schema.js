const mongoose = require('mongoose');
const leanVirtuals = require('mongoose-lean-virtuals');
const { Configuration } = require('@schul-cloud/commons');
const roleModel = require('../../role/model');
const { enableAuditLog } = require('../../../utils/database');
const { consentSchema } = require('./consent.schema');
const externalSourceSchema = require('../../../helper/externalSourceSchema');
const { defineConsentStatus, isParentConsentRequired } = require('../utils/consent');

const { Schema } = mongoose;

const defaultFeatures = [];
const USER_FEATURES = {
	EDTR: 'edtr',
};

const userSchema = new Schema({
	roles: [{ type: Schema.Types.ObjectId, ref: 'role' }],
	email: { type: String, required: true, lowercase: true },

	schoolId: {
		type: Schema.Types.ObjectId, ref: 'school', required: true, index: true,
	},

	firstName: { type: String, required: true },
	middleName: { type: String },
	lastName: { type: String, required: true },
	namePrefix: { type: String },
	nameSuffix: { type: String },
	forcePasswordChange: { type: Boolean, default: false },

	birthday: { type: Date },

	importHash: { type: String, index: true },
	// inviteHash:{type:String},

	children: [{ type: Schema.Types.ObjectId, ref: 'user' }],
	parents: [{ type: Schema.Types.ObjectId, ref: 'user' }],

	preferences: { type: Object }, // blackbox for frontend stuff like "cookies accepted"
	features: {
		type: [String],
		default: defaultFeatures,
		enum: Object.values(USER_FEATURES),
	},

	consent: consentSchema,

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
}, {
	timestamps: true,
});

userSchema.index({ schoolId: 1, roles: -1 });
// maybe the schoolId index is enough ?
// https://ticketsystem.schul-cloud.org/browse/SC-3724

if (Configuration.get('FEATURE_TSP_ENABLED') === true) {
	// to speed up lookups during TSP sync
	userSchema.index({ 'sourceOptions.$**': 1 });
}

userSchema.virtual('fullName').get(function get() {
	return [
		this.namePrefix,
		this.firstName,
		this.middleName,
		this.lastName,
		this.nameSuffix,
	].join(' ').trim().replace(/\s+/g, ' ');
});

userSchema.virtual('consentStatus').get(function get() {
	if (!this.consent) return undefined; // TODO: what happen if not defined, is it on query?
	return defineConsentStatus(this.birthday, this.consent);
});


userSchema.virtual('requiresParentConsent').get(function get() {
	if (!this.birthday) return undefined;
	return isParentConsentRequired(this.birthday);
});


userSchema.plugin(leanVirtuals);

userSchema.methods.getPermissions = function getPermissions() {
	return roleModel.resolvePermissions(this.roles);
};

enableAuditLog(userSchema);

module.exports = {
	USER_FEATURES,
	userSchema,
};
