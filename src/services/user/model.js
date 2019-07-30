const mongoose = require('mongoose');
const leanVirtuals = require('mongoose-lean-virtuals');
const roleModel = require('../role/model');

const { Schema } = mongoose;

const userSchema = new Schema({
	roles: [{ type: Schema.Types.ObjectId, ref: 'role' }],
	email: { type: String, required: true, lowercase: true },

	schoolId: { type: Schema.Types.ObjectId, ref: 'school', required: true },

	firstName: { type: String, required: true },
	middleName: { type: String },
	lastName: { type: String, required: true },
	namePrefix: { type: String },
	nameSuffix: { type: String },

	birthday: { type: Date },

	importHash: { type: String },
	// inviteHash:{type:String},

	children: [{ type: Schema.Types.ObjectId, ref: 'user' }],
	parents: [{ type: Schema.Types.ObjectId, ref: 'user' }],

	preferences: { type: Object }, // blackbox for frontend stuff like "cookies accepted"
	discoverable: { type: Boolean, default: false },

	ldapDn: { type: String },
	ldapId: { type: String },

	customAvatarBackgroundColor: { type: String },
	avatarSettings: { type: Object },
}, {
	timestamps: true,
});

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
	return roleModel.resolvePermissions(this.roles);
};

const registrationPinSchema = new Schema({
	email: { type: String, required: true },
	pin: { type: String },
	verified: { type: Boolean, default: false },
}, {
	timestamps: true,
});

/* virtual property functions */

const displayName = user => `${user.firstName} ${user.lastName}`;

const registrationPinModel = mongoose.model('registrationPin', registrationPinSchema);
const userModel = mongoose.model('user', userSchema);
module.exports = {
	userModel,
	registrationPinModel,
	displayName,
};
