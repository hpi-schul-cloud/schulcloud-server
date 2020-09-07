const accountsHelper = require('./accounts');

const generateJWT = (app) => async ({ username, password }) => {
	const result = await app.service('authentication').create(
		{
			strategy: 'local',
			username,
			password,
		},
		{
			headers: {
				'content-type': 'application/json',
			},
			provider: 'rest',
		}
	);
	return result.accessToken;
};

/**
 * Execute login with username and password
 * @returns { authentication = {accessToken, strategy}, provider = 'rest' }
 */
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

/**
 * I ) Create a account for this user
 * II) Execute login for this user to get the jwt
 * @param {User} user
 * @param {Boolean} withAccount if true the account is also return
 * @returns { [account], authentication = {accessToken, strategy}, provider = 'rest' }
 */
const generateRequestParamsFromUser = (app) => async (user) => {
	const credentials = { username: user.email, password: user.email };
	const account = await accountsHelper(app).create(credentials, 'local', user);

	const requestParams = await generateRequestParams(app)(credentials);
	requestParams.account = account;
	return requestParams;
};

module.exports = (app) => ({
	generateJWT: generateJWT(app),
	generateRequestParams: generateRequestParams(app),
	generateRequestParamsFromUser: generateRequestParamsFromUser(app),
});
