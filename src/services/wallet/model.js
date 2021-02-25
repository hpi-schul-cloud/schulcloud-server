const mongoose = require('mongoose');

const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const walletSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'user',
		},
		name: {
			type: String,
			required: true,
		},
		relationshipId: {
			type: String,
			required: true,
		},
		identityId: {
			type: String,
			required: true,
		},
		preferences: {
			manual: {
				type: Boolean,
				default: true,
			},
			portfolio: {
				type: Boolean,
				default: false,
			},
			certificates: {
				type: Boolean,
				default: false,
			},
			analytics: {
				type: Boolean,
				default: false,
			},
		},
	},
	{
		timestamps: true,
	}
);

enableAuditLog(walletSchema);

const walletModel = mongoose.model('wallet', walletSchema);

module.exports = {
	walletModel,
};
