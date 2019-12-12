const auth = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { MethodNotAllowed } = require('@feathersjs/errors');

const {
	getRedisClient, redisSetAsync, redisTtlAsync, getRedisIdentifier,
} = require('../../../utils/redis');


class JwtTimerService {
	constructor(options) {
		this.options = options || {};
	}

	/**
	 * returns the remaining seconds until the JWT used to authenticate this request is automatically logged out.
	 * this is the only authenticated request that does not reset said timer.
	 * @param {Object} params feathers params
	 */
	async find(params) {
		if (getRedisClient()) {
			const redisIdentifier = getRedisIdentifier(params.authentication.accessToken);
			const redisResponse = await redisTtlAsync(redisIdentifier);
			return Promise.resolve({ ttl: redisResponse });
		}
		throw new MethodNotAllowed('this feature is disabled on this instance');
	}

	/**
	 * resets the auto-logout timer for the JWT used to authenticate this request.
	 * @param {Object} data
	 * @param {Object} params feathers params
	 */
	async create(data, params) {
		if (getRedisClient()) {
			const redisIdentifier = getRedisIdentifier(params.authentication.accessToken);
			await redisSetAsync(
				redisIdentifier, '{"IP": "NONE", "Browser": "NONE"}', 'EX', this.app.Config.data.JWT_TIMEOUT_SECONDS,
			);
			return Promise.resolve({ ttl: this.app.Config.data.JWT_TIMEOUT_SECONDS });
		}
		throw new MethodNotAllowed('this feature is disabled on this instance');
	}

	setup(app) {
		this.app = app;
	}
}

const docs = {
	definitions: {
		jwtTimer: {
			type: 'object',
			properties: {
				ttl: {
					type: 'integer',
				},
			},
		},
	},
	operations: {
		create: {
			summary: 'reset jwt ttl',
			description: 'resets the remaining time the JWT used to authenticate this request is whitelisted,'
				+ ' and returns the value it was reset to.'
				+ ' throws an 405 error if the instance does not have support for JWT whitelisting',
			requestBody: { description: 'no request body required' },
			responses: {
				200: {
					description: 'success',
					content: { 'application/json': { schema: { $ref: '#/components/schemas/jwtTimer' } } },
				},
				405: {
					description: 'feature is disabled on this instance',
				},
			},
		},
		find: {
			summary: 'get ttl of the jwt',
			description: 'returns the remaining seconds the JWT used to authenticate this request is whitelisted.'
				+ ' throws an 405 error if the instance does not have support for JWT whitelisting',
			parameters: {},
			responses: {
				200: {
					description: 'success',
					content: { 'application/json': { schema: { $ref: '#/components/schemas/jwtTimer' } } },
				},
				405: {
					description: 'feature is disabled on this instance',
				},
			},
		},
	},
};

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
	jwtTimerService.docs = docs;
	app.use('/accounts/jwtTimer', jwtTimerService);
	app.service('/accounts/jwtTimer').hooks(jwtTimerHooks);
};

module.exports = { jwtTimerService, jwtTimerHooks, jwtTimerSetup };
