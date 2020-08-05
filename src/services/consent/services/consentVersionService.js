const { authenticate } = require('@feathersjs/authentication');
const { BadRequest } = require('@feathersjs/errors');
const {
	iff,
	isProvider,
	disallow,
} = require('feathers-hooks-common');

const {
	restrictToCurrentSchool,
	denyIfNotCurrentSchoolOrEmpty,
	hasPermission,
} = require('../../../hooks');

const { modelServices: { prepareInternalParams } } = require('../../../utils');

const ConsentVersionServiceHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [],
		get: [],
		create: [iff(isProvider('external'), [
			hasPermission('SCHOOL_EDIT'),
			restrictToCurrentSchool,
		])],
		update: [disallow()],
		patch: [disallow()],
		remove: [disallow()],
	},
	after: {
		all: [],
		find: [],
		get: [
			iff(isProvider('external'),
				denyIfNotCurrentSchoolOrEmpty({
					errorMessage: 'The current user is not allowed to list other users!',
				})),
		],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

class ConsentVersionService {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	createBase64File(data = {}) {
		const { schoolId, consentData } = data;
		if (consentData) {
			if (!schoolId) {
				return Promise.reject(new BadRequest('SchoolId is required for school consents.'));
			}
			return this.app.service('base64Files').create({
				schoolId,
				data: consentData,
				filetype: 'pdf',
				filename: 'Datenschutzerklärung',
			});
		}
		return Promise.resolve({});
	}

	get(id, params) {
		return this.app.service('consentVersionsModel').get(id, prepareInternalParams(params));
	}

	async find(params) {
		const { query = {}, ...restParams } = params;
		let searchResult;
		if (query.schoolId) {
			searchResult = await this.app.service('consentVersionsModel').find(prepareInternalParams(params));
		}

		if (searchResult && searchResult.total > 0) {
			return searchResult;
		}
		const querySchoolIdEmpty = { ...restParams, query: { ...query, schoolId: { $exists: false } } };
		return this.app.service('consentVersionsModel').find(prepareInternalParams(querySchoolIdEmpty));
	}

	async create(data, params) {
		const base64 = await this.createBase64File(data);
		if (base64._id) {
			data.consentDataId = base64._id;
			delete data.consentData;
		}

		return this.app.service('consentVersionsModel').create(data, prepareInternalParams(params));
	}

	setup(app) {
		this.app = app;
	}
}


module.exports = {
	ConsentVersionService,
	ConsentVersionServiceHooks,
};
