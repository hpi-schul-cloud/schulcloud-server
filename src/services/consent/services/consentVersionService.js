const { authenticate } = require('@feathersjs/authentication');

const { iff, isProvider, disallow } = require('feathers-hooks-common');
const { BadRequest } = require('../../../errors');

const { restrictToCurrentSchool, denyIfNotCurrentSchoolOrEmpty, hasPermission } = require('../../../hooks');

const globals = require('../../../../config/globals');
const { isSuperheroUser } = require('../../../helper/userHelpers');

const {
	modelServices: { prepareInternalParams },
} = require('../../../utils');

const ConsentVersionServiceHooks = {
	before: {
		all: [],
		find: [],
		get: [authenticate('jwt')],
		create: [iff(isProvider('external'), [authenticate('jwt'), hasPermission('SCHOOL_EDIT'), restrictToCurrentSchool])],
		update: [disallow()],
		patch: [disallow()],
		remove: [iff(isProvider('external'), [authenticate('jwt'), hasPermission('SCHOOL_EDIT'), restrictToCurrentSchool])],
	},
	after: {
		all: [],
		find: [],
		get: [
			iff(
				isProvider('external'),
				denyIfNotCurrentSchoolOrEmpty({
					errorMessage: 'The current user is not allowed to list other users!',
				})
			),
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

	// eslint-disable-next-line consistent-return
	validateConsentUpload(isShdUpload, schoolId) {
		if (isShdUpload && globals.SC_THEME === 'n21') {
			throw new BadRequest('SHD consent upload is disabled for NBC instance.');
		}
		if (!schoolId && !isShdUpload) {
			throw new BadRequest('SchoolId is required for school consents.');
		}
	}

	createBase64File(consentDocumentData) {
		const { schoolId, consentData } = consentDocumentData;
		if (consentData) {
			return this.app.service('base64Files').create({
				schoolId,
				data: consentDocumentData.consentData,
				filetype: 'pdf',
				filename: 'Privacy Policy',
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

	async create(consentDocumentData, params) {
		const isShdUpload = await isSuperheroUser(this.app, params.account.userId);
		this.validateConsentUpload(isShdUpload, consentDocumentData.schoolId);
		const base64 = await this.createBase64File(consentDocumentData);
		if (base64._id) {
			consentDocumentData.consentDataId = base64._id;
			delete consentDocumentData.consentData;
		}
		return this.app.service('consentVersionsModel').create(consentDocumentData, prepareInternalParams(params));
	}

	async remove(id, params) {
		const consent = await this.app.service('consentVersionsModel').remove(id, prepareInternalParams(params));
		if (consent.consentDataId) {
			this.app.service('base64Files').remove({ _id: consent.consentDataId });
		}
		return consent;
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	ConsentVersionService,
	ConsentVersionServiceHooks,
};
