'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const getUserGroupSchema = (additional = {}) => {
	const schema = {
		name: {type: String, required: true},
		schoolId: {type: Schema.Types.ObjectId, required: true},
		userIds: [{type: Schema.Types.ObjectId, ref: 'user'}],
		createdAt: {type: Date, 'default': Date.now},
		updatedAt: {type: Date, 'default': Date.now}
	};

	return new Schema(Object.assign(schema, additional),{
		timestamps: true
	});
};

/**
 * startDate {Date} - the date the course is first take place
 * untilDate {Date} -  the date the course is last take place
 * duration {Number} - the duration of a course lesson
 * weekday {Number} - from 1 to 7, the weekday the course take place
 */
const timeSchema = new Schema({
	startDate: {type: Date, required: true},
	untilDate: {type: Date, required: true},
	weekday: {type: Number, min: 1, max: 7, required: true},
	duration: {type: Number}
});

const courseModel = mongoose.model('course', getUserGroupSchema({
	description: {type: String},
	classIds: [{type: Schema.Types.ObjectId, required: true, ref: 'class'}],
	teacherIds: [{type: Schema.Types.ObjectId, required: true, ref: 'user'}],
	ltiToolIds: [{type: Schema.Types.ObjectId, required: true, ref: 'ltiTool'}],
	color: {type: String, required: true, 'default': '#1DE9B6'},
	gradeSystem: {type: Boolean},
	times: [timeSchema]
}));

const classModel =  mongoose.model('class', getUserGroupSchema({
	teacherIds: [{type: Schema.Types.ObjectId, ref: 'user', required: true}]
}));
const gradeModel =  mongoose.model('grade', getUserGroupSchema());

module.exports = {
	courseModel,
	classModel,
	gradeModel
};
