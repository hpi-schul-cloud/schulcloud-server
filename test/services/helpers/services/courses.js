const { courseModel } = require('../../../../src/services/user-group/model');

let createdCourseIds = [];
let coursesServices;

const removeManyCourses = (ids) => courseModel.deleteMany({ _id: { $in: ids } }).lean().exec();

const createTestCourse = (app, opt) => ({
	// required fields for base group
	name = 'testCourse',
	schoolId = opt.schoolId,
	userIds = [],
	classIds = [],
	teacherIds = [],
	ltiToolIds = [],
	substitutionIds = [],
	features = [],
	startDate,
	untilDate,
} = {}) => app.service('courses').create({
	// required fields for course
	name,
	schoolId,
	userIds,
	classIds,
	teacherIds,
	ltiToolIds,
	substitutionIds,
	features,
	startDate,
	untilDate,
}).then((course) => {
	createdCourseIds.push(course._id.toString());
	return course;
});

const cleanup = () => {
	if (createdCourseIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdCourseIds;
	createdCourseIds = [];
	return removeManyCourses(ids);
};

module.exports = (app, opt) => {
	coursesServices = app.service('courses');
	coursesServices.setup(app);
	return {
		create: createTestCourse(app, opt),
		cleanup,
		info: createdCourseIds,
	};
};
