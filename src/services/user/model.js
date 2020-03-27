const mongoose = require('mongoose');
const leanVirtuals = require('mongoose-lean-virtuals');

const { RoleModel } = require('../role/model');
const { enableAuditLog } = require('../../utils/database');
const externalSourceSchema = require('../../helper/externalSourceSchema');

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

	/**
	 * depending on system settings,
	 * a user may opt-in or -out,
	 * default=null should use TEAM_INVITATION_DEFAULT_VISIBILITY_FOR_TEACHERS instead
	*/
	discoverable: { type: Boolean, required: false },

	ldapDn: { type: String },
	ldapId: { type: String },

	...externalSourceSchema,

	customAvatarBackgroundColor: { type: String },
	avatarSettings: { type: Object },
}, {
	timestamps: true,
});

userSchema.index({ schoolId: 1, roles: -1 });
// maybe the schoolId index is enough ?
// https://ticketsystem.schul-cloud.org/browse/SC-3724

userSchema.virtual('fullName').get(function get() {
	return [
		this.namePrefix,
		this.firstName,
		this.middleName,
		this.lastName,
		this.nameSuffix,
	].join(' ').trim().replace(/\s+/g, ' ');
});
userSchema.plugin(leanVirtuals);

userSchema.methods.getPermissions = function getPermissions() {
	return RoleModel.resolvePermissions(this.roles);
};

const registrationPinSchema = new Schema({
	email: { type: String, required: true },
	pin: { type: String },
	verified: { type: Boolean, default: false },
}, {
	timestamps: true,
});

/* virtual property functions */

const displayName = (user) => `${user.firstName} ${user.lastName}`;

enableAuditLog(registrationPinSchema);
enableAuditLog(userSchema);

const registrationPinModel = mongoose.model('registrationPin', registrationPinSchema);
const userModel = mongoose.model('user', userSchema);

module.exports = {
	USER_FEATURES,
	userModel,
	registrationPinModel,
	displayName,
};
