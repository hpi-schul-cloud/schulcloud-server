const { courseModel } = require('../../../../src/services/user-group/model');

let createdCourseIds = [];

const removeManyCourses = (ids) =>
	courseModel
		.deleteMany({ _id: { $in: ids } })
		.lean()
		.exec();

const createTestCourse = (appPromise, opt) => async ({
	// required fields for base group
	name = 'testCourse',
	description = 'testCourseDescription',
	schoolId = opt.schoolId,
	userIds = [],
	classIds = [],
	teacherIds = [],
	ltiToolIds = [],
	substitutionIds = [],
	features = [],
	startDate,
	untilDate,
} = {}) => {
	const app = await appPromise;
	const course = await app.service('courses').create({
		// required fields for course
		name,
		description,
		schoolId,
		userIds,
		classIds,
		teacherIds,
		ltiToolIds,
		substitutionIds,
		features,
		startDate,
		untilDate,
	});
	createdCourseIds.push(course._id.toString());
	return course;
};

const cleanup = () => {
	if (createdCourseIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdCourseIds;
	createdCourseIds = [];
	return removeManyCourses(ids);
};

module.exports = (app, opt) => {
	return {
		create: createTestCourse(app, opt),
		cleanup,
		info: createdCourseIds,
	};
};
