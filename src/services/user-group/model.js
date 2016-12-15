'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const getUserGroupSchema = (additional = {}) => {
	const schema = {
		name: {type: String, required: true},
		schoolId: {type: Schema.Types.ObjectId, required: true},
		createdAt: {type: Date, 'default': Date.now},
		updatedAt: {type: Date, 'default': Date.now}
	};

	return new Schema(Object.assign(schema, additional),{
		timestamps: true
	});
};

const courseModel = mongoose.model('course', getUserGroupSchema({
	classId: {type: Schema.Types.ObjectId, required: true}
}));
const classModel =  mongoose.model('class', getUserGroupSchema());
const gradeModel =  mongoose.model('grade', getUserGroupSchema());

module.exports = {
	courseModel,
	classModel,
	gradeModel
};
