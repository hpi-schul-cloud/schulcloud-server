const { authenticate } = require('@feathersjs/authentication');
const { BadRequest } = require('@feathersjs/errors');
const {
	iff,
	isProvider,
	disallow,
} = require('feathers-hooks-common');

const {
	populateCurrentSchool,
	restrictToCurrentSchool,
	hasPermission,
} = require('../../../hooks');

const { modelServices: { prepareInternalParams } } = require('../../../utils');

const ConsentVersionServiceHooks = {
	before: {
		all: [iff(isProvider('external'), [
			authenticate('jwt'),
			populateCurrentSchool, // TODO: test if it is needed
			restrictToCurrentSchool, // TODO restricted erscheint mir hier nicht hilfreich
		])],
		find: [],
		get: [],
		create: [iff(isProvider('external'), hasPermission('SCHOOL_EDIT'))],
		update: [disallow()],
		patch: [disallow()],
		remove: [disallow()],
	},
	after: {
		all: [],
		find: [],
		get: [],
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

	find(params) {
		const { query } = params;
		if (query && query.schoolId) {
			if (!query.$or) {
				query.$or = [];
			}
			query.$or.push({ schoolId: query.schoolId });
			delete query.schoolId;
		}

		return this.app.service('consentVersionsModel').find(prepareInternalParams(params));
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
