/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
const { authenticate } = require('@feathersjs/authentication').hooks;
const moment = require('moment');

const { Forbidden, BadRequest } = require('../../../errors');
const { hasSchoolPermission, blockDisposableEmail, transformToDataTransferObject } = require('../../../hooks');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { validateParams, parseRequestQuery } = require('../hooks/adminUsers.hooks');
const { sendRegistrationLink, protectImmutableAttributes } = require('../hooks/userService');

const constants = require('../../../utils/constants');

const { userModel } = require('../model');

const getCurrentUserInfo = (id) => userModel.findById(id).select('schoolId').lean().exec();

class AdminUsers {
	constructor(roleName) {
		this.roleName = roleName;
		this.docs = {};
	}

	async setRole() {
		if (!this.role) {
			const role = await this.app.service('roles').find({
				query: { name: this.roleName },
			});
			this.role = role.data[0];
		}
	}

	async create(_data, _params) {
		const currentUserId = _params.account.userId.toString();
		const { schoolId } = await getCurrentUserInfo(currentUserId);
		await this.checkIfExternallyManaged(schoolId);
		const { email } = _data;
		await this.checkMail(email);
		await this.setRole();
		return this.app.service('usersModel').create({
			..._data,
			schoolId,
			roles: [this.role._id],
		});
	}

	async update(_id, _data, _params) {
		// route should be blocked
		return this.patch(_id, _data, _params);
	}

	async patch(_id, _data, _params) {
		if (!_id) throw new BadRequest('id is required');
		await this.setRole();
		const params = await this.prepareParams(_id, _params);
		await this.checkIfExternallyManaged(params.query.schoolId);

		const { email, password, createAccount } = _data;
		await this.checkMail(email, _id);
		if (!createAccount) {
			await this.updateAccount(email, _id);
		}

		params.adapter = { multi: ['patch'] };
		// _id is part of params and will be combined with the schoolId
		const createdUsers = await this.prepareRoleback(email, _id, () =>
			this.app.service('usersModel').patch(null, _data, params)
		);

		if (createdUsers.length === 0) throw new BadRequest('user could not be edit');

		const createdUser = createdUsers[0];
		if (createAccount) {
			await this.createAccount({
				username: createdUser.email,
				password,
				userId: createdUser._id.toString(),
				activated: true,
			});
		}
		return createdUser;
	}

	/**
	 * Should be used only in create in future, t
	 * he user itself should get a flag to define if it is from a external system
	 * @param {*} schoolId
	 */
	async checkIfExternallyManaged(schoolId) {
		const { isExternal } = await this.app.service('schools').get(schoolId);
		if (isExternal) {
			throw new Forbidden('Creating, editing, or removing students or teachers is only possible in the source system.');
		}
	}

	/**
	 * Create a params value for following request to filter and secure request
	 * - admins only allowed to change user on own school
	 * @param {Object} params - Feathersjs params
	 */
	async prepareParams(_id, params) {
		const currentUserId = params.account.userId.toString();
		const { schoolId } = await getCurrentUserInfo(currentUserId);

		return {
			query: {
				_id,
				roles: this.role._id,
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
			if (!constants.expressions.email.test(email)) {
				throw new BadRequest('Invalid username. Username should be a valid email format');
			}
			const user = await this.app.service('usersModel').find({ query: { email: email.toLowerCase() } });
			if (userId && user.total === 1 && equalIds(user.data[0]._id, userId)) return;
			if (user.total !== 0) {
				throw new BadRequest('Email already exists.');
			}
		}
	}

	/**
	 * Update the account email if email will be changed on user.
	 * IMPORTANT: Keep in mind to do a roleback if saving the user failed
	 * @param {*} email
	 * @param {*} userId
	 */
	async updateAccount(email, userId) {
		if (email) {
			email = email.toLowerCase();
			const account = await this.app.service('nest-account-service').findByUserId(userId.toString());
			if (account) {
				await this.app.service('nest-account-service').updateUsername(account.id, email);
			}
		}
	}

	async createAccount(account) {
		if (account.username) {
			await this.app.service('nest-account-uc').saveAccount(account);
		}
	}

	async prepareRoleback(email, userId, fu) {
		try {
			return await fu();
		} catch (err) {
			if (email) {
				const { email: oldMail } = await this.app.service('usersModel').get(userId);
				const account = await this.app.service('nest-account-service').findByUserIdOrFail(userId.toString());
				await this.app.service('nest-account-service').updateUsername(account.id, oldMail);
			}
			throw err;
		}
	}

	async setup(app) {
		this.app = app;
	}
}

const adminHookGenerator = (kind) => ({
	before: {
		all: [authenticate('jwt')],
		create: [hasSchoolPermission(`${kind}_CREATE`), blockDisposableEmail('email')],
		update: [hasSchoolPermission(`${kind}_EDIT`), protectImmutableAttributes, blockDisposableEmail('email')],
		patch: [hasSchoolPermission(`${kind}_EDIT`), protectImmutableAttributes, blockDisposableEmail('email')],
		remove: [hasSchoolPermission(`${kind}_DELETE`), parseRequestQuery, validateParams],
	},
	after: {
		all: [transformToDataTransferObject],
		create: [sendRegistrationLink],
	},
});

module.exports = {
	AdminUsers,
	adminHookGenerator,
};
