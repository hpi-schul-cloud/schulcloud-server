const mongoose = require('mongoose');

const { Schema } = mongoose;

const countySchema = new Schema(
	{
		countyId: { type: Number },
		county: { type: String },
		licensePlate: { type: String },
	},
	{
		timestamps: true,
	}
);
module.exports = {
	CountyModel: mongoose.model('county', countySchema),
	countySchema,
};
