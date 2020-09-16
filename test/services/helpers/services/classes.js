const logger = require('../../../../src/logger/index');
const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;
const { classModel } = require('../../../../src/services/user-group/model');

let createdClassesIds = [];
let classesServices;

const removeManyClasses = (ids) => classModel.deleteMany({ _id: { $in: ids } }).lean().exec();
const removeOneClass = (id) => classModel.findOneAndRemove({ _id: id }).lean().exec();

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
}) => classesServices.create({
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

const cleanup = () => {
	if (createdClassesIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdClassesIds;
	createdClassesIds = [];
	return removeManyClasses(ids);
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

	const createdClass = await classesServices.create(classObject);
	createdClassesIds.push(createdClass._id);
};

const findByName = (app) => async ([gradeLevel, className]) => {
	const classObjects = await classesServices.find({
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
			await classesServices.remove(classObject._id);
			createdClassesIds.splice(createdClassesIds.find((i) => equalIds(i, classObject._id)));
		} else {
			logger.warning(`Trying to delete a class by name that does not exist: "${gradeLevel}${className}"`);
		}
	});
	await Promise.all(promises);
};

module.exports = (app, opt) => {
	classesServices = app.service('classes');
	classesServices.setup(app);

	return {
		cleanup,
		create: createTestClass(app, opt),
		createByName: createByName(app),
		deleteByName: deleteByName(app),
		findByName: findByName(app),
		findOneByName: findOneByName(app),
		info: createdClassesIds,
		removeOne: removeOneClass,
		removeMany: removeManyClasses,
	};
};
