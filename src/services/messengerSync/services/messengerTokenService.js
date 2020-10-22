const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { Configuration } = require('@schul-cloud/commons');
const request = require('request-promise-native');
const hmacSHA512 = require('crypto-js/hmac-sha512');
const reqlib = require('app-root-path').require;

const { BadRequest, GeneralError } = reqlib('src/errors');

function obtainAccessToken(userId, homeserverApiUri, secret) {
	const loginApiUrl = `${homeserverApiUri}/_matrix/client/r0/login`;

	const password = hmacSHA512(userId, secret).toString();

	const payload = {
		type: 'm.login.password',
		user: userId,
		password,
	};

	const options = {
		uri: loginApiUrl,
		method: 'POST',
		body: payload,
		json: true,
	};
	return request(options).then((response) => {
		const session = {
			userId,
			homeserverUrl: homeserverApiUri,
			accessToken: response.access_token,
			deviceId: response.device_id,
			servername: response.home_server,
		};
		return session;
	});
}

class MessengerTokenService {
	constructor(options) {
		this.options = options || {};
	}

	async setup(app) {
		this.app = app;
	}

	/**
	 * syncs the rooms of all users on the school.
	 * @param {Object} data should contain a schoolId field
	 * @param {Object} params feathers params object.
	 */
	async create(data, params) {
		if (!Configuration.get('FEATURE_MATRIX_MESSENGER_ENABLED')) {
			throw new GeneralError('messenger not supported on this instance');
		}

		const scId = (params.account || {}).userId;
		if (!scId) throw new BadRequest('no user');

		const homeserver = Configuration.get('MATRIX_SERVERNAME');
		const matrixId = `@sso_${scId.toString()}:${homeserver}`;
		const matrixUri = Configuration.get('MATRIX_URI');
		const matrixSecret = Configuration.get('MATRIX_SECRET');

		return obtainAccessToken(matrixId, matrixUri, matrixSecret);
	}
}

const messengerTokenService = new MessengerTokenService({});

const messengerTokenHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [disallow()],
		get: [disallow()],
		create: [],
		update: [disallow()],
		patch: [disallow()],
		remove: [disallow()],
	},
	after: {},
};

module.exports = { messengerTokenService, messengerTokenHooks };
