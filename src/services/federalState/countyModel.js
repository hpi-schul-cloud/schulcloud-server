const mongoose = require('mongoose');

const { Schema } = mongoose;

const countySchema = new Schema({
	countyId: { type: Number },
	name: { type: String },
	antaresKey: { type: String },
});
const CountyModel = mongoose.model('county', countySchema);

module.exports = {
	CountyModel,
	countySchema,
};
