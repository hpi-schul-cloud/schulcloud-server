const { hasPermission } = require('../../../hooks');
const lesson = require('../model');

const checkIfCourseGroupLesson = async (
	courseGroupPermission,
	coursePermission,
	isCreate,
	context,
) => {
	const isCourseGroup = isCreate
		? context.data.courseGroupId
		: await lesson
			.findOne({ _id: context.id })
			.then((_lesson) => _lesson.courseGroupId);

	if (isCourseGroup) {
		return hasPermission(courseGroupPermission)(context);
	}
	return hasPermission(coursePermission)(context);
};

module.exports = checkIfCourseGroupLesson;
