const { Types } = require('mongoose');
const { homeworkModel, submissionModel } = require('./model');

const toObjectId = (id) => new Types.ObjectId(id.toString());

const removeHomeworks = async (query) => {
	const homeworks = await homeworkModel.find(query).select({ _id: 1 }).lean().exec();
	const homeworkIds = homeworks.map((homework) => homework._id);

	if (homeworkIds.length === 0) {
		return;
	}

	await submissionModel.deleteMany({ homeworkId: { $in: homeworkIds } }).exec();
	await homeworkModel.deleteMany({ _id: { $in: homeworkIds } }).exec();
};

const removeHomeworksByCourseId = async (courseId) => {
	await removeHomeworks({ courseId: toObjectId(courseId) });
};

const removeHomeworksByLessonId = async (lessonId) => {
	await removeHomeworks({ lessonId: toObjectId(lessonId) });
};

module.exports = {
	removeHomeworksByCourseId,
	removeHomeworksByLessonId,
};
