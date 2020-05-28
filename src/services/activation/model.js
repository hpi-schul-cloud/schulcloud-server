const mongoose = require('mongoose');
const ShortId = require('mongoose-shortid-nodeps');
const { Configuration } = require('@schul-cloud/commons');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;
const { KEYWORDS } = require('./utils');

const ttl = Configuration.get('ACTIVATION_LINK_PERIOD_OF_VALIDITY');

const activationSchema = new Schema({
	activationCode: { type: ShortId, required: true },
	account: { type: Schema.Types.ObjectId, required: true, ref: 'account' },
	keyword: { type: String, required: true, enum: Object.values(KEYWORDS) },
	quarantinedObject: { type: Object, required: true },
	mailSend: { type: Boolean, default: false },
	activated: { type: Boolean, default: false },
}, { timestamps: true });
activationSchema.index({ activationCode: 1 }, { unique: true });
activationSchema.index({ account: 1, keyword: -1 }, { unique: true });
activationSchema.index({ createdAt: 1 }, { expireAfterSeconds: ttl });

enableAuditLog(activationSchema);

const activationModel = mongoose.model('activation', activationSchema);

module.exports = { activationModel };
