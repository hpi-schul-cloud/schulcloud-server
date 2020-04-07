const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

const { sortByGradeAndOrName, prepareGradeLevelUnset, saveSuccessor } = require('../hooks/helpers/classHooks');
const { paginate } = require('../../../utils/array');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);
const restrictToUsersOwnClasses = globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnClasses);

class Classes {
	constructor(options) {
		this.options = options || {};
	}

	/**
	 * retrieves the year from the query, or from the school of the user.
	 * @param {Object} query feathers query
	 */
	async getSchoolYearsFromQuery(query) {
		if ((query.year || {}).$in) return query.year.$in;
		if (query.year) return [query.year];

		const school = await this.app.service('schools').get(query.schoolId);
		const years = school.years.schoolYears.map((y) => y._id);
		if (((query.$sort || {}).year === '-1' || (query.$sort || {}).year === 'desc')) {
			years.reverse();
		}
		years.push({ $exists: false }); // to find classes that dont have a year
		return years;
	}

	/**
	 * returns classes just like the class-model service would, but sorted by years.
	 * @param {Object} params feathers params object.
	 */
	async findClassesByYear(params) {
		const years = await this.getSchoolYearsFromQuery(params.query);

		const classPromises = years.map((y) => {
			const yearParams = Object.assign(
				{},
				params,
				{ query: Object.assign({}, params.query, { year: y._id || y }) },
			);
			return this.app.service('classModel').find(yearParams);
		});
		const classesByYear = await Promise.all(classPromises);
		const data = classesByYear.reduce((acc, current) => acc.concat(current.data || current), []);

		if (params.query.$paginate !== false && params.paginate !== false) params.query.$paginate = true;
		const result = paginate(data, params.query);
		return result;
	}

	async find(params) {
		if ((params.query.$sort || {}).year && params.query.schoolId) {
			return this.findClassesByYear(params);
		}

		return this.app.service('classModel').find(params);
	}

	get(id, params) {
		return this.app.service('classModel').get(id, params);
	}

	create(data, params) {
		return this.app.service('classModel').create(data, params);
	}

	update(id, data, params) {
		return this.app.service('classModel').update(id, data, params);
	}

	patch(id, data, params) {
		return this.app.service('classModel').patch(id, data, params);
	}

	remove(id, params) {
		return this.app.service('classModel').remove(id, params);
	}

	setup(app) {
		this.app = app;
	}
}

const classesService = new Classes({
	paginate: {
		default: 25,
		max: 100,
	},
});

const classesHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [
			globalHooks.hasPermission('CLASS_VIEW'),
			restrictToCurrentSchool,
			restrictToUsersOwnClasses,
			sortByGradeAndOrName,
			globalHooks.addCollation,
			globalHooks.mapPaginationQuery,
		],
		get: [
			restrictToCurrentSchool,
			restrictToUsersOwnClasses,
		],
		create: [
			globalHooks.hasPermission('CLASS_CREATE'),
			restrictToCurrentSchool,
		],
		update: [
			globalHooks.hasPermission('CLASS_EDIT'),
			restrictToCurrentSchool,
			prepareGradeLevelUnset,
		],
		patch: [
			globalHooks.hasPermission('CLASS_EDIT'),
			restrictToCurrentSchool,
			globalHooks.permitGroupOperation,
			prepareGradeLevelUnset,
		],
		remove: [globalHooks.hasPermission('CLASS_REMOVE'), restrictToCurrentSchool, globalHooks.permitGroupOperation],
	},
	after: {
		all: [],
		find: [],
		get: [
			globalHooks.ifNotLocal(
				globalHooks.denyIfNotCurrentSchool({
					errorMessage: 'Die angefragte Gruppe gehört nicht zur eigenen Schule!',
				}),
			)],
		create: [
			saveSuccessor,
		],
		update: [],
		patch: [],
		remove: [],
	},
};

module.exports = { classesService, classesHooks };
