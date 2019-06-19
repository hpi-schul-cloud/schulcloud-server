<<<<<<< HEAD
=======
const accountsHelper = require('./accounts');

>>>>>>> develop
const generateJWT = app => async ({ username, password }) => {
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

const generateRequestParams = app => async ({ username, password }) => {
	const fetchJwt = generateJWT(app);
	const jwt = await fetchJwt({ username, password });
	return {
		headers: {
			authorization: `Bearer ${jwt}`,
		},
		provider: 'rest',
	};
};

<<<<<<< HEAD
module.exports = app => ({
	generateJWT: generateJWT(app),
	generateRequestParams: generateRequestParams(app),
=======
const generateRequestParamsFromUser = app => async (user) => {
	const credentials = { username: user.email, password: user.email };
	await accountsHelper(app).create(credentials, 'local', user);
	return generateRequestParams(app)(credentials);
};

// hook.params.account.userId
const fakeLoginParams = app => ({
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

module.exports = app => ({
	generateJWT: generateJWT(app),
	generateRequestParams: generateRequestParams(app),
	generateRequestParamsFromUser: generateRequestParamsFromUser(app),
	fakeLoginParams: fakeLoginParams(app),
>>>>>>> develop
});
