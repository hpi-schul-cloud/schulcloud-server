const mongoose = require('mongoose');
const { Configuration } = require('@schul-cloud/commons');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;
const { KEYWORDS, STATE } = require('./utils');

const activationSchema = new Schema({
	activationCode: { type: String, required: true },
	account: { type: Schema.Types.ObjectId, required: true, ref: 'account' },
	keyword: { type: String, required: true, enum: Object.values(KEYWORDS) },
	quarantinedObject: { type: Object, required: true },
	mailSend: { type: Boolean, default: false },
	state: { type: String, default: STATE.notStarted, enum: Object.values(STATE) },
}, { timestamps: true });
activationSchema.index({ activationCode: 1 }, { unique: true });
activationSchema.index({ account: 1, keyword: -1 }, { unique: true });
activationSchema.index(
	{ createdAt: 1 },
	{ expireAfterSeconds: Configuration.get('ACTIVATION_LINK_PERIOD_OF_VALIDITY_SECONDS') },
);

enableAuditLog(activationSchema);

const activationModel = mongoose.model('activation', activationSchema);

module.exports = { activationModel };
