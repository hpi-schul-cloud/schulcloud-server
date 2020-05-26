const mongoose = require('mongoose');
const ShortId = require('mongoose-shortid-nodeps');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;
const { KEYWORDS } = require('./utils');

const activationSchema = new Schema({
	_id: {
		type: ShortId,
		len: 24,
		base: 64,
		alphabet: undefined,
		retries: 20,
	},
	account: { type: Schema.Types.ObjectId, required: true, ref: 'account' },
	keyword: { type: String, required: true, enum: Object.values(KEYWORDS) },
	quarantinedObject: { type: Object, required: true },
	mailSend: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, expires: '2h', default: Date.now },
});
activationSchema.index({ account: 1, keyword: -1 }, { unique: true });

enableAuditLog(activationSchema);

const activationModel = mongoose.model('activation', activationSchema);

module.exports = { activationModel };
