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


const homeworkModel = mongoose.model('homework', getUserGroupSchema({
	description: {type: String, required: true},
	dueDate: {type: Date, required: true},
	editableDate: {type: Date, required: true},
	submitted: [{type: Schema.Types.ObjectId, required: true, ref: 'user', graded: {type: Number}}],
	classIds: [{type: Schema.Types.ObjectId, required: true, ref: 'class'}],

}));
const courseModel = mongoose.model('course', getUserGroupSchema({
	classIds: [{type: Schema.Types.ObjectId, required: true, ref: 'class'}],
	teacherIds: [{type: Schema.Types.ObjectId, required: true, ref: 'user'}],
	ltiToolIds: [{type: Schema.Types.ObjectId, required: true, ref: 'ltiTool'}]
}));
const classModel =  mongoose.model('class', getUserGroupSchema({
	teacherIds: [{type: Schema.Types.ObjectId, required: true}]
}));
const gradeModel =  mongoose.model('grade', getUserGroupSchema());

module.exports = {
	courseModel,
	classModel,
	homeworkModel,
	gradeModel
};
