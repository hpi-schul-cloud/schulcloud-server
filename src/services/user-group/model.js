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
 * duration {Number} - the duration of a course lesson
 * startTime {Number] - the start time of a course lesson as milliseconds
 * weekday {Number} - from 0 to 6, the weekday the course take place (e.g. 0 = monday, 1 = tuesday ... )
 * eventId {String} - id of the event in the external calendar-service
 * room {String} - a specific location for the recurring course lesson, e.g. a room number
 */
const timeSchema = new Schema({
	weekday: {type: Number, min: 0, max: 6, required: true},
	startTime: {type: Number},
	duration: {type: Number},
	eventId: {type: String},
	room: {type: String}
});

const courseModel = mongoose.model('course', getUserGroupSchema({
	description: {type: String},
	classIds: [{type: Schema.Types.ObjectId, required: true, ref: 'class'}],
	teacherIds: [{type: Schema.Types.ObjectId, required: true, ref: 'user'}],
	substitutionIds: [{type: Schema.Types.ObjectId, required: true, ref: 'user'}],
	ltiToolIds: [{type: Schema.Types.ObjectId, required: true, ref: 'ltiTool'}],
	color: {type: String, required: true, 'default': '#1DE9B6'},
	startDate: {type: Date},
	untilDate: {type: Date},
	times: [timeSchema]
}));

// represents a sub-group of students inside a course, e.g. for projects etc.
const courseGroupModel = mongoose.model('courseGroup', getUserGroupSchema({
	courseId: {type: Schema.Types.ObjectId, required: true, ref: 'course'}
}));

const classSchema = getUserGroupSchema({
	teacherIds: [{type: Schema.Types.ObjectId, ref: 'user', required: true}]
});

const classModel =  mongoose.model('class', classSchema);

const gradeModel =  mongoose.model('grade', getUserGroupSchema());

module.exports = {
	courseModel,
	courseGroupModel,
	classModel,
	gradeModel
};
