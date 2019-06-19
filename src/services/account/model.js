const mongoose = require('mongoose');

const { Schema } = mongoose;

const accountSchema = new Schema({
	username: { type: String, required: true, lowercase: true },
	password: { type: String },

	token: { type: String },
	credentialHash: { type: String },

	userId: { type: Schema.Types.ObjectId, ref: 'user' },
	systemId: { type: Schema.Types.ObjectId, ref: 'system' }, // if systemId => SSO

	expiresAt: { type: Date },

	activated: { type: Boolean, default: false },
}, {
	timestamps: true,
});

const accountModel = mongoose.model('account', accountSchema);

module.exports = accountModel;
