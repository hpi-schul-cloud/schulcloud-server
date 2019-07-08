const { hasPermission } = require('../../../hooks');
const lesson = require('../model');

const checkIfCourseGroupLesson = async (permission1, permission2, isCreate, context) => {
	const isCourseGroup = isCreate
		? context.data.courseGroupId
		: await lesson.findOne({ _id: context.id }).then(_lesson => (JSON.stringify(_lesson.courseGroupId)));

	if (isCourseGroup) {
		return hasPermission(permission1)(context);
	}
	return hasPermission(permission2)(context);
};

module.exports = checkIfCourseGroupLesson;
