const mongoose = require('mongoose');

const { Schema } = mongoose;

const userMatchSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'user', unique: true },
		matchedBy: { type: String, enum: ['admin', 'auto'] },
	},
	{ timestamps: true }
);

const importUserSchema = new Schema(
	{
		schoolId: {
			type: Schema.Types.ObjectId,
			ref: 'school',
			required: true,
		},

		system: { type: Schema.Types.ObjectId, ref: 'system', required: true },

		ldapDn: { type: String, required: true }, // LDAP login username
		ldapId: { type: String, required: true }, // UUID to identify during the sync

		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		email: { type: String, required: true, lowercase: true },
		roles: [{ type: String }],
		classNames: [{ type: String }],
		match: userMatchSchema,
		flagged: { type: Boolean, default: false, required: true },
	},
	{
		timestamps: true,
	}
);

importUserSchema.index({ schoolId: 1, ldapId: 1 }, { unique: true });
importUserSchema.index({ schoolId: 1, ldapDn: 1 }, { unique: true });
importUserSchema.index({ schoolId: 1, email: 1 }, { unique: true });

const importUserModel = mongoose.model('importUser', importUserSchema);

module.exports = {
	importUserModel,
};
