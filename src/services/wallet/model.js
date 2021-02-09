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
