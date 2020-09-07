const mongoose = require('mongoose');

const { Schema } = mongoose;
const crypto = require('crypto');
const { enableAuditLog } = require('../../utils/database');

const { KEYWORDS, STATE, createQuarantinedObject, getQuarantinedObject } = require('./utils/generalUtils');

/**
 * WARNING: Document will be removed after 7 days
 */
const activationSchema = new Schema(
	{
		activationCode: { type: String, required: true },
		userId: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
		keyword: { type: String, required: true, enum: Object.values(KEYWORDS) },
		quarantinedObject: { type: Object, required: true },
		mailSent: { type: [Date] },
		state: { type: String, default: STATE.NOT_STARTED, enum: Object.values(STATE) },
	},
	{ timestamps: true }
);
activationSchema.index({ activationCode: 1 }, { unique: true });
activationSchema.index({ userId: 1, keyword: 1 }, { unique: true });
activationSchema.index(
	{ createdAt: 1 },
	{ expireAfterSeconds: 604800 } // 7 Days
);

// add activationCode and construct quarantinedObject
activationSchema.pre('validate', function handleSave(next) {
	this.activationCode = crypto.randomBytes(64).toString('hex');
	this.quarantinedObject = createQuarantinedObject(this.keyword, this.quarantinedObject);
	next();
});

activationSchema.post('save', (result) => {
	result.quarantinedObject = getQuarantinedObject(result);
	return result;
});

// deconstruct quarantinedObject
activationSchema.post('find', (result) => {
	(result || []).forEach((element) => {
		if (element.quarantinedObject) {
			element.quarantinedObject = getQuarantinedObject(element);
		}
	});
	return result;
});

enableAuditLog(activationSchema);

const activationModel = mongoose.model('activation', activationSchema);

module.exports = { activationModel };
