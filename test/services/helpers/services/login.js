const logger = require('../../../../src/logger');
const accountsHelper = require('./accounts');

const generateJWT = (app) => async ({ username, password }) => {
	const result = await app.service('authentication').create({
		strategy: 'local',
		username,
		password,
	}, {
		headers: {
			'content-type': 'application/json',
		},
		provider: 'rest',
	});
	return result.accessToken;
};

const generateRequestParams = (app) => async ({ username, password }) => {
	const fetchJwt = generateJWT(app);
	const jwt = await fetchJwt({ username, password });
	return {
		authentication: {
			accessToken: jwt,
			strategy: 'jwt',
		},
		provider: 'rest',
	};
};

const generateRequestParamsFromUser = (app) => async (user, withAccount = false) => {
	const credentials = { username: user.email, password: user.email };
	const $account = await accountsHelper(app).create(credentials, 'local', user)
		.catch((err) => {
			logger.warning(err);
			return err;
		});

	const requestParams = await generateRequestParams(app)(credentials);
	if (withAccount === true) {
		requestParams.account = $account.toObject();
	}
	return requestParams;
};

// hook.params.account.userId
const fakeLoginParams = (app) => ({
	userId,
	account,
	headers = {},
	query = {},
	route = {},
}) => ({
	account: account || {
		userId,
	},
	authenticated: true,
	provider: 'rest',
	headers,
	query,
	route,
	payload: {
		accountId: (account || {})._id,
	},
});

module.exports = (app) => ({
	generateJWT: generateJWT(app),
	generateRequestParams: generateRequestParams(app),
	generateRequestParamsFromUser: generateRequestParamsFromUser(app),
	fakeLoginParams: fakeLoginParams(app),
});
