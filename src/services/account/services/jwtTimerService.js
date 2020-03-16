const auth = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { MethodNotAllowed, NotAuthenticated } = require('@feathersjs/errors');
const { Configuration } = require('@schul-cloud/commons');
const docs = require('./jwtTimerDocs');

const {
	getRedisClient, redisSetAsync, redisTtlAsync, extractRedisFromJwt, getRedisValue,
} = require('../../../utils/redis');


class JwtTimerService {
	constructor(options) {
		this.options = options || {};
	}

	/**
	 * Returns the remaining seconds until the JWT used to authenticate this request is automatically logged out.
	 * This is the only authenticated request that does not reset said timer.
	 * @param {Object} params feathers params
	 */
	async find(params) {
		if (getRedisClient()) {
			const { redisIdentifier } = extractRedisFromJwt(params.authentication.accessToken);
			const redisResponse = await redisTtlAsync(redisIdentifier);
			return Promise.resolve({ ttl: redisResponse });
		}
		throw new MethodNotAllowed('This feature is disabled on this instance!');
	}

	/**
	 * Resets the auto-logout timer for the JWT used to authenticate this request.
	 * @param {Object} data
	 * @param {Object} params feathers params
	 */
	async create(data, params) {
		if (getRedisClient()) {
			const { redisIdentifier } = extractRedisFromJwt(params.authentication.accessToken);
			const redisResponse = await redisTtlAsync(redisIdentifier);
			if (redisResponse < 0) throw new NotAuthenticated('Session was expired due to inactivity - autologout.');
			await redisSetAsync(
				redisIdentifier, getRedisValue(), 'EX', Configuration.get('JWT_TIMEOUT_SECONDS'),
			);
			return Promise.resolve({ ttl: Configuration.get('JWT_TIMEOUT_SECONDS') });
		}
		throw new MethodNotAllowed('This feature is disabled on this instance!');
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

const jwtTimerServiceSetup = (app) => {
	jwtTimerService.docs = docs;
	app.use('/accounts/jwtTimer', jwtTimerService);
	app.service('/accounts/jwtTimer').hooks(jwtTimerHooks);
};

module.exports = { jwtTimerService, jwtTimerHooks, jwtTimerServiceSetup };
