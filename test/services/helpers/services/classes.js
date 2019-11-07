const logger = require('../../../../src/logger/index');
const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;

let createdClassesIds = [];

const createTestClass = (app, opt) => ({
	// required fields
	name = 'testClass',
	schoolId = opt.schoolId,
	userIds = [],
	teacherIds = [],
	nameFormat = 'static',
	gradeLevel = undefined,
	year = undefined,
	predecessor = undefined,
}) => app.service('classes').create({
	name,
	schoolId,
	userIds,
	teacherIds,
	nameFormat,
	gradeLevel,
	year,
	predecessor,
}).then((res) => {
	createdClassesIds.push(res._id.toString());
	return res;
});

const cleanup = (app) => () => {
	const ids = createdClassesIds;
	createdClassesIds = [];
	return ids.map((id) => app.service('classes').remove(id));
};

const createByName = (app) => async ([gradeLevel, className, schoolId], overrides = {}) => {
	const school = await app.service('schools').get(schoolId);
	const year = await app.service('years').get(school.currentYear);

	const classObject = {
		schoolId,
		year,
		gradeLevel,
		name: className,
		...overrides,
	};

	const createdClass = await app.service('classes').create(classObject);
	createdClassesIds.push(createdClass._id);
};

const findByName = (app) => async ([gradeLevel, className]) => {
	const classObjects = await app.service('classes').find({
		query: {
			gradeLevel,
			name: className,
		},
		paginate: false,
	});

	return classObjects;
};

const findOneByName = (app) => async ([gradeLevel, className]) => {
	const classes = await (findByName(app)([gradeLevel, className]));
	return classes[0];
};

const deleteByName = (app) => async ([gradeLevel, className]) => {
	const classObjects = await findByName(app)([gradeLevel, className]);
	const promises = classObjects.map(async (classObject) => {
		if (classObject && classObject._id) {
			await app.service('classes').remove(classObject._id);
			createdClassesIds.splice(createdClassesIds.find((i) => equalIds(i, classObject._id)));
		} else {
			logger.warning(`Trying to delete a class by name that does not exist: "${gradeLevel}${className}"`);
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
