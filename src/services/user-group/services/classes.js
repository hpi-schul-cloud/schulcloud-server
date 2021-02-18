const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider } = require('feathers-hooks-common');
const {
	restrictToCurrentSchool,
	hasPermission,
	addCollation,
	mapPaginationQuery,
	permitGroupOperation,
	denyIfNotCurrentSchool,
} = require('../../../hooks');

const {
	sortByGradeAndOrName,
	prepareGradeLevelUnset,
	saveSuccessor,
	restrictFINDToUsersOwnClasses,
	restrictToUsersOwnClasses,
} = require('../hooks/classes');

const { paginate } = require('../../../utils/array');

const {
	modelServices: { prepareInternalParams },
} = require('../../../utils');

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
		if ((query.$sort || {}).year === '-1' || (query.$sort || {}).year === 'desc') {
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
			const yearParams = {
				...params,
				query: { ...params.query, year: y._id || y },
			};
			return this.app.service('classModel').find(yearParams);
		});
		const classesByYear = await Promise.all(classPromises);
		const data = classesByYear.reduce((acc, current) => acc.concat(current.data || current), []);

		if (params.query.$paginate !== false && params.paginate !== false) params.query.$paginate = true;
		const result = paginate(data, params.query);
		return result;
	}

	async find(params) {
		const internalParams = prepareInternalParams(params);
		if ((internalParams.query.$sort || {}).year && internalParams.query.schoolId) {
			return this.findClassesByYear(internalParams);
		}

		return this.app.service('classModel').find(internalParams);
	}

	get(id, params) {
		const internalParams = prepareInternalParams(params);
		return this.app.service('classModel').get(id, internalParams);
	}

	create(data, params) {
		const internalParams = prepareInternalParams(params);
		return this.app.service('classModel').create(data, internalParams);
	}

	update(id, data, params) {
		const internalParams = prepareInternalParams(params);
		return this.app.service('classModel').update(id, data, internalParams);
	}

	patch(id, data, params) {
		const internalParams = prepareInternalParams(params);
		return this.app.service('classModel').patch(id, data, internalParams);
	}

	remove(id, params) {
		const internalParams = prepareInternalParams(params);
		return this.app.service('classModel').remove(id, internalParams);
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
			hasPermission('CLASS_VIEW'),
			iff(isProvider('external'), restrictToCurrentSchool),
			iff(isProvider('external'), restrictFINDToUsersOwnClasses),
			sortByGradeAndOrName,
			addCollation,
			mapPaginationQuery,
		],
		get: [iff(isProvider('external'), restrictToCurrentSchool), iff(isProvider('external'), restrictToUsersOwnClasses)],
		create: [hasPermission('CLASS_CREATE'), iff(isProvider('external'), restrictToCurrentSchool)],
		update: [
			hasPermission('CLASS_EDIT'),
			iff(isProvider('external'), restrictToCurrentSchool),
			iff(isProvider('external'), restrictToUsersOwnClasses),
			prepareGradeLevelUnset,
		],
		patch: [
			hasPermission('CLASS_EDIT'),
			iff(isProvider('external'), restrictToCurrentSchool),
			iff(isProvider('external'), restrictToUsersOwnClasses),
			permitGroupOperation,
			prepareGradeLevelUnset,
		],
		remove: [
			hasPermission('CLASS_REMOVE'),
			iff(isProvider('external'), restrictToCurrentSchool),
			iff(isProvider('external'), restrictToUsersOwnClasses),
			permitGroupOperation,
		],
	},
	after: {
		all: [],
		find: [],
		get: [
			iff(
				isProvider('external'),
				denyIfNotCurrentSchool({
					errorMessage: 'Die angefragte Gruppe gehört nicht zur eigenen Schule!',
				})
			),
		],
		create: [saveSuccessor],
		update: [],
		patch: [],
		remove: [],
	},
};

module.exports = { classesService, classesHooks };
