const mongoose = require('mongoose');

const { Schema } = mongoose;

const privacySchema = new Schema({
	name: { type: String, required: true },
	body: { type: String, default: '' },
	publishedAt: { type: Date, required: true },
}, { timestamps: true });

const privacyModel = mongoose.model('privacy', privacySchema);
module.exports = privacyModel;
