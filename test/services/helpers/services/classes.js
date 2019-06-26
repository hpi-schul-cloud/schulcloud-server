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

const createByName = app => async ([gradeLevelName, className, schoolId]) => {
	const gradeLevels = await app.service('gradeLevels').find({
		query: {
			name: gradeLevelName,
		},
		paginate: false,
	});
	let classObject;
	if (gradeLevels.length > 0) {
		classObject = {
			schoolId,
			nameFormat: 'gradeLevel+name',
			gradeLevel: gradeLevels[0]._id,
			name: className,
		};
	} else {
		classObject = {
			schoolId,
			nameFormat: 'static',
			name: className,
		};
	}
	const klass = await app.service('classes').create(classObject);
	createdClassesIds.push(klass._id);
};

const findByName = app => async ([gradeLevelName, className]) => {
	const gradeLevels = await app.service('gradeLevels').find({
		query: {
			name: gradeLevelName,
		},
		paginate: false,
	});
	let classObject;
	if (gradeLevels.length > 0) {
		[classObject] = await app.service('classes').find({
			query: {
				nameFormat: 'gradeLevel+name',
				gradeLevel: gradeLevels[0]._id,
				name: className,
			},
			paginate: false,
		});
	} else {
		[classObject] = await app.service('classes').find({
			query: {
				nameFormat: 'static',
				name: className,
			},
			paginate: false,
		});
	}
	return classObject;
};

const deleteByName = app => async ([gradeLevelName, className]) => {
	const classObject = await findByName(app)([gradeLevelName, className]);
	await app.service('classes').remove(classObject._id);
	createdClassesIds.splice(createdClassesIds.find(i => i.toString() === classObject._id.toString()));
};

module.exports = (app, opt) => ({
	cleanup: cleanup(app),
	create: createTestClass(app, opt),
	createByName: createByName(app),
	deleteByName: deleteByName(app),
	findByName: findByName(app),
	info: createdClassesIds,
});
