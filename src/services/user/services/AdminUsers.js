/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const { Forbidden, GeneralError, BadRequest } = require('@feathersjs/errors');
const { authenticate } = require('@feathersjs/authentication').hooks;
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { Configuration } = require('@schul-cloud/commons');
const logger = require('../../../logger');
const { createMultiDocumentAggregation } = require('../utils/aggregations');
const {
	hasSchoolPermission,
	blockDisposableEmail,
} = require('../../../hooks');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { validateParams } = require('../hooks/adminUsers.hooks');
const { updateAccountUsername } = require('../hooks/userService');

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
	constructor(roleName) {
		this.roleName = roleName;
		this.docs = {};
	}

	async find(params) {
		return this.getUsers(undefined, params);
	}

	async get(id, params) {
		return this.getUsers(id, params);
	}

	async getUsers(_id, params) {
		// integration test did not get the role in the setup
		// so here is a workaround set it at first call
		if (!this.role) {
			this.role = (await this.app.service('roles').find({
				query: { name: this.roleName },
			})).data[0];
		}

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
					'preferences.registrationMailSend',
				],
				skip: clientQuery.$skip || clientQuery.skip,
				limit: clientQuery.$limit || clientQuery.limit,
			};
			if (_id) {
				query._id = _id;
			} else if (clientQuery.users) {
				query._id = clientQuery.users;
				// If the number of users exceeds 20, the underlying parsing library
				// will convert the array to an object with the index as the key.
				// To continue working with it, we convert it here back to the array form.
				// See the documentation for further infos: https://github.com/ljharb/qs#parsing-arrays
				if (typeof query._id === 'object') query._id = Object.values(query._id);
			}
			if (clientQuery.consentStatus) query.consentStatus = clientQuery.consentStatus;
			if (clientQuery.classes) query.classes = clientQuery.classes;
			if (clientQuery.firstName) query.firstName = clientQuery.firstName;
			if (clientQuery.lastName) query.lastName = clientQuery.lastName;
			if (clientQuery.usersForConsent) query._id = clientQuery.usersForConsent;
			if (clientQuery.searchQuery) {
				query.$or = [
					{ firstName: { $regex: clientQuery.searchQuery, $options: 'i' } },
					{ lastName: { $regex: clientQuery.searchQuery, $options: 'i' } },
					{ email: { $regex: clientQuery.searchQuery, $options: 'i' } },
				];
			}

			const dateQueries = ['createdAt'];
			for (const dateQuery of dateQueries) {
				if (clientQuery[dateQuery]) {
					if (typeof clientQuery[dateQuery] === 'object') {
						for (const [key, value] of Object.entries(clientQuery[dateQuery])) {
							if (['$gt', '$gte', '$lt', '$lte'].includes(key)) {
								clientQuery[dateQuery][key] = new Date(value);
							}
						}
						query[dateQuery] = clientQuery[dateQuery];
					} else {
						query[dateQuery] = new Date(clientQuery[dateQuery]);
					}
				}
			}

			return new Promise((resolve, reject) => userModel.aggregate(createMultiDocumentAggregation(query)).option({
				collation: { locale: 'de', caseLevel: true },
			}).exec((err, res) => {
				if (err) reject(err);
				else resolve(res[0] || {});
			}));
		} catch (err) {
			if ((err || {}).code === 403) {
				throw new Forbidden('You have not the permission to execute this.', err);
			}
			if (err && err.code >= 500) {
				const uuid = uuidv4();
				logger.error(uuid, err);
				if (Configuration.get('NODE_ENV') !== 'production') { throw err; }
				throw new GeneralError(uuid);
			}
			throw err;
		}
	}

	async create(data, params) {
		const { account } = params;
		const currentUserId = account.userId.toString();

		// checks if school isExternal, throws forbidden if it is
		const { schoolId } = await getCurrentUserInfo(currentUserId);
		const { isExternal } = await this.app.service('schools').get(schoolId);
		if (isExternal) {
			throw new Forbidden('Creating new students or teachers is only possible in the source system.');
		}

		// checks for unique email accounts, throws bad request if it already exists
		const { email } = data;
		const userService = this.app.service('/users');
		const accounts = await userService.find({ query: { email: email.toLowerCase() } });
		if (accounts.total > 0) {
			throw new BadRequest('Email already exists.');
		}

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
		const currentUser = await getCurrentUserInfo(params.account.userId);

		if (id) {
			const userToRemove = await getCurrentUserInfo(id);
			if (!equalIds(currentUser.schoolId, userToRemove.schoolId)) {
				throw new Forbidden('You cannot remove users from other schools.');
			}
			await this.app.service('accountModel').remove(null, { query: { userId: id } });
			return this.app.service('usersModel').remove(id);
		}

		const usersIds = await Promise.all(_ids.map((userId) => getCurrentUserInfo(userId)));
		if (usersIds.some((user) => !equalIds(currentUser.schoolId, user.schoolId))) {
			throw new Forbidden('You cannot remove users from other schools.');
		}

		await this.app.service('accountModel').remove(null, { query: { userId: { $in: _ids } } });
		return this.app.service('usersModel').remove(null, { query: { _id: { $in: _ids } } });
	}

	async setup(app) {
		this.app = app;
		this.role = (await this.app.service('roles').find({
			query: { name: this.roleName },
		})).data[0];
	}
}

const formatBirthdayOfUsers = ({ result: { data: users } }) => {
	users.forEach((user) => {
		if (user.birthday) user.birthday = moment(user.birthday).format('DD.MM.YYYY');
		if (user.birthday) {
			user.birthday = moment(user.birthday).format('DD.MM.YYYY');
		}
	});
};

const adminHookGenerator = (kind) => ({
	before: {
		all: [authenticate('jwt')],
		find: [hasSchoolPermission(`${kind}_LIST`)],
		get: [hasSchoolPermission(`${kind}_LIST`)],
		create: [hasSchoolPermission(`${kind}_CREATE`), blockDisposableEmail('email')],
		update: [hasSchoolPermission(`${kind}_EDIT`)],
		patch: [hasSchoolPermission(`${kind}_EDIT`)],
		remove: [hasSchoolPermission(`${kind}_DELETE`), validateParams],
	},
	after: {
		find: [formatBirthdayOfUsers],
		patch: [updateAccountUsername],
	},
});


module.exports = {
	AdminUsers,
	adminHookGenerator,
};
