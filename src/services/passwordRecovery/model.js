// model.js - A mongoose model
// https://www.edu-apps.org/code.html - LTI Parameters
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const ShortId = require('mongoose-shortid-nodeps');

const { Schema } = mongoose;

const passwordRecoverySchema = new Schema({
	_id: {
		type: ShortId,
		len: 24,
		base: 62, // a-Z, 0-9
		retries: 20, // number of retries on collision
	},
	account: { type: Schema.Types.ObjectId, ref: 'account' },
	changed: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

const passwordRecoveryModel = mongoose.model('passwordRecovery', passwordRecoverySchema);

module.exports = passwordRecoveryModel;
