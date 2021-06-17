const mongoose = require('mongoose');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const accountSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			lowercase: true,
			index: true,
		},
		password: { type: String },

		token: { type: String },
		credentialHash: { type: String },

		userId: { type: Schema.Types.ObjectId, ref: 'user', index: true },
		systemId: { type: Schema.Types.ObjectId, ref: 'system' }, // if systemId => SSO

		lasttriedFailedLogin: { type: Date, default: 0 },
		expiresAt: { type: Date },
		activated: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

accountSchema.index({ userId: 1, systemId: 1 }); // for LDAP sync

enableAuditLog(accountSchema);

const accountModel = mongoose.model('account', accountSchema);

module.exports = accountModel;
