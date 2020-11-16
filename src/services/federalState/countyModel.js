const mongoose = require('mongoose');

const { Schema } = mongoose;

const countySchema = new Schema(
	{
		countyId: { type: Number },
		county: { type: String },
		antaresKey: { type: String },
	},
	{
		timestamps: true,
	}
);
module.exports = {
	CountyModel: mongoose.model('federalstate.counties', countySchema),
	countySchema,
};
