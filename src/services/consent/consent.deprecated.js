const { BadRequest } = require('@feathersjs/errors');
const { authenticate } = require('@feathersjs/authentication');
const { modelServices: { prepareInternalParams } } = require('../../utils');
const { userToConsent, modifyDataForUserSchema } = require('./utils');
const globalHooks = require('../../hooks');

const MODEL_SERVICE = 'usersModel';

const restrictToUserOrRole = (hook) => {
	const userService = hook.app.service('users');
	return userService.find({
		query: {
			_id: hook.params.account.userId,
			$populate: 'roles',
		},
	}).then((res) => {
		let access = false;
		res.data[0].roles.forEach((role) => {
			if (role.name === 'superhero' || role.name === 'teacher' || role.name === 'administrator') {
				access = true;
			}
		});
		if (access) {
			return hook;
		}

		hook.params.query.userId = hook.params.account.userId;
		return hook;
	});
};

/**
 * check if userId is set and set it to an empty $in clause if not
 * if userId.$in is an object convert it to an array
 * @param {*} context
 */
const setUserIdToCorrectForm = (context) => {
	if (!context.params.query) {
		context.params.query = {};
	}

	if ((context.params.query.userId || {}).$in && !Array.isArray(context.params.query.userId.$in)) {
		context.params.query.userId.$in = Object.values(context.params.query.userId.$in);
	}
	return context;
};


const consentHook = {
	before: {
		all: [authenticate('jwt')],
		find: [
			authenticate('jwt'),
			globalHooks.ifNotLocal(restrictToUserOrRole),
			setUserIdToCorrectForm,
		],
	},
};

class ConsentService {
	async find(params) {
		const { query: { userId, ...oldQuery } } = params;

		params.query = {};

		if (({}).hasOwnProperty.call(oldQuery, 'userId')) {
			if (!userId.$in) {
				const user = await this.modelService.get(userId);
				return {
					total: 1,
					limit: 25,
					skip: 0,
					data: userToConsent(user),
				};
			}
			params.query._id = {
				$in: userId.$in,
			};
		}

		if (Object.keys(oldQuery).length !== 0) {
			params.query.constent = {
				...oldQuery,
			};
		} else {
			params.query.consent = {
				$exists: true,
			};
		}


		const users = await this.app.service(MODEL_SERVICE).find(prepareInternalParams(params));
		return {
			...users,
			data: users.data.map(userToConsent),
		};
	}

	async get(_id, params) {
		return this.app.service(MODEL_SERVICE).get(_id, prepareInternalParams(params));
	}

	async create(data, params) {
		if (!({}).hasOwnProperty.call(data, 'userId')) {
			throw BadRequest('Consent could only create with a UserId');
		}

		const { userId, ...consent } = data;

		this.modelServices.patch(
			userId,
			modifyDataForUserSchema(consent),
			prepareInternalParams(params),
		);
	}

	async patch(_id, data, params) {
		return this.app
			.service(MODEL_SERVICE)
			.patch(_id, modifyDataForUserSchema(data), prepareInternalParams(params));
	}

	async update(_id, data, params) {
		return this.app
			.service(MODEL_SERVICE)
			.update(_id, modifyDataForUserSchema(data), prepareInternalParams(params));
	}

	setup(app) {
		this.app = app;
		this.modelService = this.app.service(MODEL_SERVICE);
	}
}

module.exports = {
	ConsentService,
	consentHook,
};
