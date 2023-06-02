// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');

const { Schema } = mongoose;

const keySchema = new Schema(
	{
		name: { type: String, required: true },
		key: { type: String, required: true },
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	},
	{
		timestamps: true,
	}
);

const keyModel = mongoose.model('key', keySchema);

module.exports = keyModel;
