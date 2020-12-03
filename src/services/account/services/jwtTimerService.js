const auth = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const reqlib = require('app-root-path').require;

const { MethodNotAllowed, AutoLogout } = reqlib('src/errors');
const docs = require('./jwtTimerDocs');

const {
	getRedisClient,
	redisSetAsync,
	redisTtlAsync,
	extractDataFromJwt,
	getRedisData,
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
			const { redisIdentifier } = extractDataFromJwt(params.authentication.accessToken);
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
			const { redisIdentifier, privateDevice } = extractDataFromJwt(params.authentication.accessToken);
			const redisResponse = await redisTtlAsync(redisIdentifier);
			if (redisResponse < 0) throw new AutoLogout('Session was expired due to inactivity - autologout.');
			const redisData = getRedisData({ privateDevice });
			const { expirationInSeconds } = redisData;
			await redisSetAsync(redisIdentifier, JSON.stringify(redisData), 'EX', expirationInSeconds);
			return Promise.resolve({ ttl: expirationInSeconds });
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
		all: [auth.hooks.authenticate('jwt')],
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
