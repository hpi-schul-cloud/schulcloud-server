const mongoose = require('mongoose');

const { Schema } = mongoose;

const serviceSchema = new Schema({
	name: { type: String, required: true },
	someUser: { type: Schema.Types.ObjectId, ref: 'user' },
}, { timestamps: true });

const serviceModel = mongoose.model('template', serviceSchema);

module.exports = { serviceModel };
