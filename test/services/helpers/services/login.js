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

module.exports = (app, opt) => ({
	generateJWT: generateJWT(app),
	generateRequestParams: generateRequestParams(app),
});
