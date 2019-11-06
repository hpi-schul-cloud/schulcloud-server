// release-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const releaseSchema = new Schema({
	_id: { type: String, required: true },
	name: { type: String, required: true },
	body: { type: String, default: '' },
	url: { type: String, required: true },
	author: { type: String, required: true },
	authorUrl: { type: String, required: true },
	createdAt: { type: Date, required: true },
	publishedAt: { type: Date, required: true },
	zipUrl: { type: String },
});

enableAuditLog(releaseSchema);
const releaseModel = mongoose.model('release', releaseSchema);

module.exports = releaseModel;
