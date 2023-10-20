const logger = require('../../../../src/logger/index');
const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;
const { classModel } = require('../../../../src/services/user-group/model');

let createdClassesIds = [];

const removeManyClasses = (ids) =>
	classModel
		.deleteMany({ _id: { $in: ids } })
		.lean()
		.exec();
const removeOneClass = (id) => classModel.findOneAndRemove({ _id: id }).lean().exec();

const createTestClass = (appPromise, opt) => async ({
	// required fields
	name = 'testClass',
	schoolId = opt.schoolId,
	userIds = [],
	teacherIds = [],
	nameFormat = 'static',
	gradeLevel = undefined,
	year = undefined,
	predecessor = undefined,
	ldapDN = undefined,
}) => {
	const app = await appPromise;
	const res = await app.service('classes').create({
		name,
		schoolId,
		userIds,
		teacherIds,
		nameFormat,
		gradeLevel,
		year,
		predecessor,
		ldapDN,
	});
	createdClassesIds.push(res._id.toString());
	return res;
};

const cleanup = () => {
	if (createdClassesIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdClassesIds;
	createdClassesIds = [];
	return removeManyClasses(ids);
};

const createByName = (appPromise) => async ([gradeLevel, className, schoolId], overrides = {}) => {
	const app = await appPromise;
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

const findByName = (appPromise) => async ([gradeLevel, className]) => {
	const app = await appPromise;
	const classObjects = await app.service('classes').find({
		query: {
			gradeLevel,
			name: className,
		},
		paginate: false,
	});

	return classObjects;
};

const findOneByName = (appPromise) => async ([gradeLevel, className]) => {
	const classes = await findByName(appPromise)([gradeLevel, className]);
	return classes[0];
};

const deleteByName = (appPromise) => async ([gradeLevel, className]) => {
	const app = await appPromise;
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

module.exports = (app, opt) => {
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
