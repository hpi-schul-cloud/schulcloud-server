
const { BadRequest } = require('feathers-errors');
const { courseModel, lessonModel } = require('../../models');

const getCourse = id => courseModel.findById(id)
	.select('userIds classIds teacherIds substitutionIds')
	.lean()
	.exec()
	.catch((err) => { throw new BadRequest(err); });

const getLessonsByCourse = courseId => lessonModel.find({ courseId })
	.select('contents')
	.lean().exec();

module.exports = {
	getCourse,
	getLessonsByCourse,
};
