const mongoose = require('mongoose');
const { enableAuditLog } = require('../../../utils/database');

const { Schema } = mongoose;

const registrationPinSchema = new Schema(
	{
		email: { type: String, required: true },
		pin: { type: String },
		verified: { type: Boolean, default: false },
		importHash: { type: String },
	},
	{
		timestamps: true,
	}
);

/*
query list with biggest impact of database load
schulcloud.registrationpins    find         {"importHash": 1} -> 1
schulcloud.registrationpins    find         {"email": 1, "pin": 1} -> 2
schulcloud.registrationpins    find         {"email": 1} -> 3
*/
registrationPinSchema.index({ importHash: 1 }); // ok = 1
registrationPinSchema.index({ email: 1, pin: 1 }); // ok = 2
registrationPinSchema.index({ email: 1 }); // ok = 3

enableAuditLog(registrationPinSchema);

module.exports = {
	registrationPinSchema,
};
