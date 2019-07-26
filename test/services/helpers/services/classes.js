const logger = require('../../../../src/logger/index');

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

const createByName = app => async ([gradeLevelName, className, schoolId], overrides = {}) => {
	const school = await app.service('schools').get(schoolId);
	const year = await app.service('years').get(school.currentYear);
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
			year,
			nameFormat: 'gradeLevel+name',
			gradeLevel: gradeLevels[0]._id,
			name: className,
			...overrides,
		};
	} else {
		classObject = {
			schoolId,
			year,
			nameFormat: 'static',
			name: className,
			...overrides,
		};
	}
	const createdClass = await app.service('classes').create(classObject);
	createdClassesIds.push(createdClass._id);
};

const findByName = app => async ([gradeLevelName, className]) => {
	const gradeLevels = await app.service('gradeLevels').find({
		query: {
			name: gradeLevelName,
		},
		paginate: false,
	});
	let classObjects;
	if (gradeLevels.length > 0) {
		classObjects = await app.service('classes').find({
			query: {
				nameFormat: 'gradeLevel+name',
				gradeLevel: gradeLevels[0]._id,
				name: className,
			},
			paginate: false,
		});
	} else {
		classObjects = await app.service('classes').find({
			query: {
				nameFormat: 'static',
				name: className,
			},
			paginate: false,
		});
	}
	return classObjects;
};

const findOneByName = app => async ([gradeLevelName, className]) => {
	const classes = await (findByName(app)([gradeLevelName, className]));
	return classes[0];
};

const deleteByName = app => async ([gradeLevelName, className]) => {
	const classObjects = await findByName(app)([gradeLevelName, className]);
	const promises = classObjects.map(async (classObject) => {
		if (classObject && classObject._id) {
			await app.service('classes').remove(classObject._id);
			createdClassesIds.splice(createdClassesIds.find(i => i.toString() === classObject._id.toString()));
		} else {
			logger.warn(`Trying to delete a class by name that does not exist: "${gradeLevelName}${className}"`);
		}
	});
	await Promise.all(promises);
};

module.exports = (app, opt) => ({
	cleanup: cleanup(app),
	create: createTestClass(app, opt),
	createByName: createByName(app),
	deleteByName: deleteByName(app),
	findByName: findByName(app),
	findOneByName: findOneByName(app),
	info: createdClassesIds,
});
