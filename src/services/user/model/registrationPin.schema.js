const mongoose = require('mongoose');
const { enableAuditLog } = require('../../../utils/database');

const { Schema } = mongoose;

const registrationPinSchema = new Schema(
	{
		email: { type: String, required: true },
		pin: { type: String },
		verified: { type: Boolean, default: false },
		importHash: { type: String, index: true },
	},
	{
		timestamps: true,
	}
);

enableAuditLog(registrationPinSchema);

module.exports = {
	registrationPinSchema,
};
