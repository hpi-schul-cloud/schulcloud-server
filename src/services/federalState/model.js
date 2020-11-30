// federalState-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const { enableAuditLog } = require('../../utils/database');
const { countySchema } = require('./countyModel');

const { Schema } = mongoose;

const federalStateSchema = new Schema({
	name: { type: String, required: true },
	abbreviation: { type: String, required: true },
	logoUrl: { type: String, required: true },
	counties: [{ type: countySchema }],
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

enableAuditLog(federalStateSchema);

const federalStateModel = mongoose.model('federalstate', federalStateSchema);

module.exports = federalStateModel;
