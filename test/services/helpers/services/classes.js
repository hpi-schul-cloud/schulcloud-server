let createdClassesIds = [];

const createTestClass = (app, opt) => ({
	// required fields
	name = 'testClass',
	schoolId = opt.schoolId,
	userIds = [],
	teacherIds = [],
	nameFormat = 'static',
	gradeLevel = undefined,
}) => app.service('classes').create({
	// required fields for user
	name,
	schoolId,
	userIds,
	teacherIds,
	nameFormat,
	gradeLevel,
}).then((res) => {
	createdClassesIds.push(res._id.toString());
	return res;
});

const cleanup = app => () => {
	const ids = createdClassesIds;
	createdClassesIds = [];
	return ids.map(id => app.service('classes').remove(id));
};

module.exports = (app, opt) => ({
	create: createTestClass(app, opt),
	cleanup: cleanup(app),
	info: createdClassesIds,
});
