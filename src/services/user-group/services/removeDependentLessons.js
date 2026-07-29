const { Types } = require('mongoose');
const { LessonModel } = require('../../lesson/model');
const { courseGroupModel } = require('../model');

const toObjectId = (id) => new Types.ObjectId(id.toString());

const removeLessonsByCourseId = async (courseId) => {
	const normalizedCourseId = toObjectId(courseId);
	const courseGroups = await courseGroupModel.find({ courseId: normalizedCourseId }).select({ _id: 1 }).lean().exec();
	const courseGroupIds = courseGroups.map((courseGroup) => courseGroup._id);

	const query = {
		$or: [{ courseId: normalizedCourseId }],
	};

	if (courseGroupIds.length > 0) {
		query.$or.push({ courseGroupId: { $in: courseGroupIds } });
	}

	await LessonModel.deleteMany(query).exec();
	await courseGroupModel.deleteMany({ courseId: normalizedCourseId }).exec();
};

const removeLessonsByCourseGroupId = async (courseGroupId) => {
	await LessonModel.deleteMany({ courseGroupId: toObjectId(courseGroupId) }).exec();
};

module.exports = {
	removeLessonsByCourseId,
	removeLessonsByCourseGroupId,
};
