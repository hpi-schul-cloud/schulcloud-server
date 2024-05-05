// model.js - A mongoose model
// https://www.edu-apps.org/code.html - LTI Parameters
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');

const { Schema } = mongoose;

const passwordRecoverySchema = new Schema({
	account: { type: String, required: true },
	changed: { type: Boolean, default: false },
	token: { type: String, required: true, index: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

const passwordRecoveryModel = mongoose.model('passwordRecovery', passwordRecoverySchema);

module.exports = passwordRecoveryModel;
