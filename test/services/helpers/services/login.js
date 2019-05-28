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
	fakeLoginParams: fakeLoginParams(app),
});
