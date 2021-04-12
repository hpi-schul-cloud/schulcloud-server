// model.js - A mongoose model
// https://www.edu-apps.org/code.html - LTI Parameters
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const passwordRecoverySchema = new Schema({
	account: { type: Schema.Types.ObjectId, ref: 'account' },
	changed: { type: Boolean, default: false },
	token: { type: String, required: true, index: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

enableAuditLog(passwordRecoverySchema);

const passwordRecoveryModel = mongoose.model('passwordRecovery', passwordRecoverySchema);

module.exports = passwordRecoveryModel;
