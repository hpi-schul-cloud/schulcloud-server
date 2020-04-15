// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');

const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const keySchema = new Schema({
	name: { type: String, required: true },
	key: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
}, {
	timestamps: true,
});

const modelName = 'key';
enableAuditLog(keySchema, { modelName });
const keyModel = mongoose.model(modelName, keySchema);

module.exports = keyModel;
