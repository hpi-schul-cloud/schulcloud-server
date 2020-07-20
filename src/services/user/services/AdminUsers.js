/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { authenticate } = require('@feathersjs/authentication').hooks;
const logger = require('../../../logger');
const { createMultiDocumentAggregation } = require('../../consent/utils/aggregations');
const {
	hasSchoolPermission,
} = require('../../../hooks');

const { userModel } = require('../model');

const getCurrentUserInfo = (id) => userModel.findById(id)
	.select('schoolId')
	.lean()
	.exec();

const getCurrentYear = (ref, schoolId) => ref.app.service('schools')
	.get(schoolId, {
		query: { $select: ['currentYear'] },
	})
	.then(({ currentYear }) => currentYear.toString());

class AdminUsers {
	constructor(role) {
		this.role = {
			name: role,
		};
		this.docs = {};
	}

	async find(params) {
		return this.getUsers(undefined, params);
	}

	async get(id, params) {
		return this.getUsers(id, params);
	}

	async getUsers(_id, params) {
		try {
			const { query: clientQuery = {}, account } = params;
			const currentUserId = account.userId.toString();

			// fetch base data
			const { schoolId } = await getCurrentUserInfo(currentUserId);
			const schoolYearId = await getCurrentYear(this, schoolId);

			const query = {
				schoolId,
				roles: this.role._id,
				schoolYearId,
				sort: clientQuery.$sort || clientQuery.sort,
				select: [
					'consentStatus',
					'consent',
					'classes',
					'firstName',
					'lastName',
					'email',
					'createdAt',
					'importHash',
					'birthday',
				],
				skip: clientQuery.$skip || clientQuery.skip,
				limit: clientQuery.$limit || clientQuery.limit,
			};
			if (_id) query._id = _id;
			if (clientQuery.consentStatus) query.consentStatus = clientQuery.consentStatus;
			if (clientQuery.classes) query.classes = clientQuery.classes;
			if (clientQuery.createdAt) query.createdAt = clientQuery.createdAt;
			if (clientQuery.firstName) query.firstName = clientQuery.firstName;
			if (clientQuery.lastName) query.lastName = clientQuery.lastName;

			return new Promise((resolve, reject) => userModel.aggregate(createMultiDocumentAggregation(query)).option({
				collation: { locale: 'de', caseLevel: true },
			}).exec((err, res) => {
				if (err) reject(err);
				else if (_id) resolve(res[0].data[0]);
				else resolve(res[0]);
			}));
		} catch (err) {
			if ((err || {}).code === 403) {
				throw new Forbidden('You have not the permission to execute this.', err);
			}
			throw new BadRequest('Can not fetch data.', err);
		}
	}

	async create(data, params) {
		return this.app.service('usersModel').create(data);
	}

	async update(id, data, params) {
		return this.app.service('usersModel').update(id, data);
	}

	async patch(id, data, params) {
		return this.app.service('usersModel').patch(id, data);
	}

	async remove(id, params) {
		const { _ids } = params.query;
		if (id) {
			return this.app.service('usersModel').remove(id);
		}
		return this.app.service('usersModel').remove(null, { query: { _id: { $in: _ids } } });
	}

	async setup(app) {
		this.app = app;
		this.role = (await app.service('roles').find({ query: this.role })).data[0];
	}
}

const adminHookGenerator = (kind) => ({
	before: {
		all: [authenticate('jwt')],
		find: [hasSchoolPermission(`${kind}_LIST`)],
		get: [hasSchoolPermission(`${kind}_LIST`)],
		create: [hasSchoolPermission(`${kind}_CREATE`)],
		update: [hasSchoolPermission(`${kind}_EDIT`)],
		patch: [hasSchoolPermission(`${kind}_EDIT`)],
		remove: [hasSchoolPermission(`${kind}_DELETE`)],
	},
});


module.exports = {
	AdminUsers,
	adminHookGenerator,
};
