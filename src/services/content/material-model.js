/**
 * this model is a replica of the contentApi-content model
 * this will be stored for lessons and we have to duplicate it because the contentApi refetches every content every 6 hours
 */

const mongoose = require('mongoose');

const { Schema } = mongoose;

const targetGroupSchema = new Schema({
	state: { type: String },
	schoolType: { type: String },
	grade: { type: String },
});

const relatedResourceSchema = new Schema({
	originId: { type: String },
	relationType: { type: String },
});

const materialSchema = new Schema({
	originId: { type: String },
	title: { type: String, required: true },
	client: { type: String, required: true },
	url: { type: String, required: true },
	merlinReference: { type: String },
	license: [{ type: String }],
	description: { type: String },
	contentType: { type: Number },
	lastModified: { type: Date },
	language: { type: String },
	subjects: [{ type: String }],
	targetGroups: [targetGroupSchema],
	target: { type: String },
	tags: [{ type: String }],
	relatedResources: [relatedResourceSchema],
	popularity: { type: Number },
	thumbnailUrl: { type: String },
	editorsPick: { type: Boolean },
	createdAt: { type: Date, default: Date.now },
});

const materialModel = mongoose.model('material', materialSchema);

module.exports = materialModel;
