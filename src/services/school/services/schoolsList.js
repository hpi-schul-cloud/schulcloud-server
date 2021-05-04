const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { Forbidden, GeneralError } = require('../../../errors');
const logger = require('../../../logger');
const publicSchoolsHooks = require('../hooks/publicSchools.hooks');
const { schoolModel } = require('../model');

class SchoolsListService {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	async find() {
		const schoolQuery = {
			purpose: { $ne: 'expert' },
		};
		const systemsQuery = {
			path: 'systems',
			select: '_id type alias',
			match: { $or: [{ type: { $ne: 'ldap' } }, { 'ldapConfig.active': { $eq: true } }] },
		};
		const schools = await schoolModel
			.find(schoolQuery)
			.populate(systemsQuery)
			.select(['name', 'systems'])
			.sort('name')
			.lean();
		return schools;
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	SchoolsListService,
};
