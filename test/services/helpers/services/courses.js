let createdCourseIds = [];

const createTestCourse = (app, opt) => ({
	// required fields for base group
	name = 'testCourse',
	schoolId = opt.schoolId,
	userIds = [],
	classIds = [],
	teacherIds = [],
	ltiToolIds = [],
}) => app.service('courses').create({
	// required fields for user
	name,
	schoolId,
	userIds,
	classIds,
	teacherIds,
	ltiToolIds,
}).then((course) => {
	createdCourseIds.push(course._id.toString());
	return course;
});

const cleanup = app => () => {
	const ids = createdCourseIds;
	createdCourseIds = [];
	return ids.map(id => app.service('classes').remove(id));
};

module.exports = (app, opt) => ({
	create: createTestCourse(app, opt),
	cleanup: cleanup(app),
	info: createdCourseIds,
});
