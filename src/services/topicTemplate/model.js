'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const topicTemplateSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
		subjectId: {
			type: Schema.Types.ObjectId,
			ref: 'subjecttype',
			required: true
		},
		gradeLevelId: { type: Schema.Types.ObjectId, ref: 'gradeLevel' },
		name: { type: String, required: true },
		numberOfWeeks: { type: String, required: true },
		unitsPerWeek: { type: String, required: true },
		content: { type: String },
		lectureUnits: [{ type: String }],
		examinations: [{ timeValue: String, typeValue: String, textValue: String }],
		material: [{ type: Schema.Types.ObjectId, ref: 'file' }]
	},
	{
		timestamps: true
	}
);

const topicTemplateModel = mongoose.model('topictemplate', topicTemplateSchema);

module.exports = topicTemplateModel;
