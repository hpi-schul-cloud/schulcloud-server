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
const { updateAccountUsername } = require('../hooks/userService');

const { userModel } = require('../model');
const account = require('../../account');

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
			if (clientQuery.createdAt) query.createdAt = clientQuery.createdAt;
			if (clientQuery.firstName) query.firstName = clientQuery.firstName;
			if (clientQuery.lastName) query.lastName = clientQuery.lastName;

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

	async create(_data, _params) {
		const params = await this.prepareParams(_params);
		await this.checkExternal(params.query.schoolId);
		const { email } = _data;
		await this.checkMail(email);
		return this.app.service('usersModel').create(_data, params);
	}

	async update(_id, _data, _params) {
		if (!_id) throw new BadRequest('id is required');
		const params = await this.prepareParams(_params);
		await this.checkExternal(params.query.schoolId);
		const { email } = _data;
		await this.checkMail(email, _id);
		await this.updateAccount(email, _id);
		return this.prepareRoleback(email, _id, () => this.app.service('usersModel').update(_id, _data, params));
	}

	async patch(_id, _data, _params) {
		if (!_id) throw new BadRequest('id is required');
		const params = await this.prepareParams(_params);
		await this.checkExternal(params.query.schoolId);
		const { email } = _data;
		await this.checkMail(email, _id);
		await this.updateAccount(email, _id);
		return this.prepareRoleback(email, _id, () => this.app.service('usersModel').patch(_id, _data, params));
	}

	/**
	 * Should be used only in create in future, t
	 * he user itself should get a flag to define if it is from a external system
	 * @param {*} schoolId
	 */
	async checkExternal(schoolId) {
		const { isExternal } = await this.app.service('schools').get(schoolId);
		if (isExternal) {
			throw new Forbidden('Creating new students or teachers is only possible in the source system.');
		}
	}

	/**
	 * Create a params value for following request to filter and secure request
	 * - admins only allowed to change user on own school
	 * @param {Object} params - Feathersjs params
	 */
	async prepareParams(params) {
		const currentUserId = params.account.userId.toString();
		const { schoolId } = await getCurrentUserInfo(currentUserId);

		return {
			query: {
				schoolId: schoolId.toString(),
			},
		};
	}

	/**
	 * request user and compare the email address.
	 * if possible it should be solved via unique index on database
	 * @param {string} email
	 * @param {string} userId
	 */
	async checkMail(email, userId) {
		if (email) {
			const user = await this.app.service('usersModel').find({ query: { email: email.toLowerCase() } });
			if (userId && user.total === 1 && user.data[0]._id.toString() === userId.toString()) return;
			if (user.total !== 0) {
				throw new BadRequest('Email already exists.');
			}
		}
	}

	/**
	 * Update the account email if eamil will be changed on user.
	 * IMPORTANT: Keep in min to do a roleback if saving the user failed
	 * @param {*} email
	 * @param {*} userId
	 */
	async updateAccount(email, userId) {
		if (email) {
			email = email.toLowerCase();
			await this.app.service('accountModel').patch(null, { username: email }, {
				query: {
					userId,
					username: { $ne: email },
				},
			});
		}
	}

	async prepareRoleback(email, userId, fu) {
		try {
			return fu();
		} catch (err) {
			if (email) {
				const { email: oldMail } = await this.app.service('usersModel').get(userId);
				await this.app.service('accountModel').patch(null, { username: oldMail }, {
					query: {
						userId,
					},
				});
			}
			throw err;
		}
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
		this.role = (await this.app.service('roles').find({
			query: { name: this.roleName },
		})).data[0];
	}
}

const formatBirthdayOfUsers = ({ result: { data: users } }) => {
	users.forEach((user) => { user.birthday = moment(user.birthday).format('DD.MM.YYYY'); });
};

const adminHookGenerator = (kind) => ({
	before: {
		all: [authenticate('jwt')],
		find: [hasSchoolPermission(`${kind}_LIST`)],
		get: [hasSchoolPermission(`${kind}_LIST`)],
		create: [hasSchoolPermission(`${kind}_CREATE`), blockDisposableEmail('email')],
		update: [hasSchoolPermission(`${kind}_EDIT`), blockDisposableEmail('email')],
		patch: [hasSchoolPermission(`${kind}_EDIT`), blockDisposableEmail('email')],
		remove: [hasSchoolPermission(`${kind}_DELETE`)],
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
