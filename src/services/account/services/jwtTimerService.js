const auth = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { MethodNotAllowed } = require('@feathersjs/errors');

const { getRedisClient, redisSetAsync, redisTtlAsync, getRedisIdentifier } = require('../../../utils/redis');

class JwtTimerService {
	constructor(options) {
		this.options = options || {};
	}

	/**
	 * returns the remaining seconds until the JWT used to authenticate this request is automatically logged out.
	 * this is the only authenticated request that does not reset said timer.
	 * @param {Object} params feathers params
	 */
	find(params) {
		if (getRedisClient()) {
			const redisIdentifier = getRedisIdentifier(params.authentication.accessToken);
			return redisTtlAsync(redisIdentifier);
		}
		throw new MethodNotAllowed('this feature is disabled on this instance');
	}

	/**
	 * resets the auto-logout timer for the JWT used to authenticate this request.
	 * @param {Object} data
	 * @param {Object} params feathers params
	 */
	create(data, params) {
		if (getRedisClient()) {
			const redisIdentifier = getRedisIdentifier(params.authentication.accessToken);
			return redisSetAsync(
				redisIdentifier, '{"IP": "NONE", "Browser": "NONE"}', 'EX', this.app.Config.data.JWT_TIMEOUT_SECONDS,
			);
		}
		throw new MethodNotAllowed('this feature is disabled on this instance');
	}

	setup(app) {
		this.app = app;
	}
}

const jwtTimerService = new JwtTimerService();

const jwtTimerHooks = {
	before: {
		all: [
			auth.hooks.authenticate('jwt'),
		],
		find: [],
		get: [disallow()],
		create: [],
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

const jwtTimerSetup = (app) => {
	app.use('/accounts/jwtTimer', jwtTimerService);
	app.service('/accounts/jwtTimer').hooks(jwtTimerHooks);
};

module.exports = { jwtTimerService, jwtTimerHooks, jwtTimerSetup };
