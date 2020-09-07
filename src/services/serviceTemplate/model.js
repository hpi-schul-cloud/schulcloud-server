const mongoose = require('mongoose');

const { Schema } = mongoose;

const serviceSchema = new Schema(
	{
		name: { type: String, required: true },
		schoolId: { type: Schema.Types.ObjectId, ref: 'school' },
		magicNumber: { type: Number },
	},
	{ timestamps: true }
);

const serviceModel = mongoose.model('template', serviceSchema);

module.exports = { serviceModel };
