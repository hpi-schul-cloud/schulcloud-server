const { courseGroupModel } = require('../../../../src/services/user-group/model');

let createdCourseIds = [];

const removeManyCourses = (ids) =>
	courseGroupModel
		.deleteMany({ _id: { $in: ids } })
		.lean()
		.exec();

const createTestCourseGroup = (app, opt) => ({
	// required fields for base group
	name = 'testCourse',
	schoolId = opt.schoolId,
	userIds = [],
	classIds = [],
	courseId = undefined,
} = {}) =>
	courseGroupModel
		.create({
			// required fields for user
			name,
			schoolId,
			userIds,
			classIds,
			courseId,
		})
		.then((course) => {
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

module.exports = (app, opt) => ({
	create: createTestCourseGroup(app, opt),
	cleanup,
	info: createdCourseIds,
});
