const mongoose = require('mongoose');
const { enableAuditLog } = require('../../../utils/database');

const { Schema } = mongoose;

const registrationPinSchema = new Schema(
	{
		email: { type: String, required: true },
		pin: { type: String },
		verified: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

enableAuditLog(registrationPinSchema);

module.exports = {
	registrationPinSchema,
};
