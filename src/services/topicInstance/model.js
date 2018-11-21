'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const topicInstanceSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
		parentTemplate: {
			type: Schema.Types.ObjectId,
			ref: 'topictemplate',
			required: true
		},
		course: { type: Schema.Types.ObjectId, ref: 'course', required: true },
		name: { type: String, required: true },
		utcStartDate: {type: Number, required: true},
		numberOfWeeks: { type: String, required: true },
		unitsPerWeek: { type: String, required: true },
		content: { type: String },
		lectureUnits: [{ name: String }],
		examinations: [{ time: String, type: String, text: String }],
		material: [{ type: Schema.Types.ObjectId, ref: 'file' }]
	},
	{
		timestamps: true
	}
);

const topicInstanceModel = mongoose.model('topicinstance', topicInstanceSchema);

module.exports = topicInstanceModel;
