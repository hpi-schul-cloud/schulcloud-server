'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const getUserGroupSchema = (additional = {}) => {
	const schema = {
		schoolId: {type: Schema.Types.ObjectId, required: true},
		userIds: [{type: Schema.Types.ObjectId, ref: 'user'}],
		createdAt: {type: Date, 'default': Date.now},
		updatedAt: {type: Date, 'default': Date.now}
	};

	return new Schema(Object.assign(schema, additional),{
		timestamps: true
	});
};


const homeworkModel = mongoose.model('homework', getUserGroupSchema({
	name: {type: String, required: true},
	description: {type: String, required: true},
	dueDate: {type: Date, required: true},
	availableDate: {type: Date, required: true},
	teacherId: {type: Schema.Types.ObjectId, required: true, ref: 'user'},
	courseId: {type: Schema.Types.ObjectId, required: false, ref: 'course'},
	private: {type: Boolean},
	publicSubmissions: {type: Boolean}
}));
const submissionModel = mongoose.model('submission', getUserGroupSchema({
	comment: {type: String, required: false},
	grade: {type: Number, required: false},
	gradeComment: {type: String, required: false},
	homeworkId: {type: Schema.Types.ObjectId, required: true, ref: 'homework'},
	studentId: {type: Schema.Types.ObjectId, required: true, ref: 'user'}
}));
const courseModel = mongoose.model('course', getUserGroupSchema({
	name: {type: String, required: true},
	classIds: [{type: Schema.Types.ObjectId, required: true, ref: 'class'}],
	teacherIds: [{type: Schema.Types.ObjectId, required: true, ref: 'user'}],
	ltiToolIds: [{type: Schema.Types.ObjectId, required: true, ref: 'ltiTool'}]
}));
const classModel =  mongoose.model('class', getUserGroupSchema({
	name: {type: String, required: true},
	teacherIds: [{type: Schema.Types.ObjectId, required: true}]
}));
const gradeModel =  mongoose.model('grade', getUserGroupSchema());

module.exports = {
	courseModel,
	classModel,
	homeworkModel,
	submissionModel,
	gradeModel
};
