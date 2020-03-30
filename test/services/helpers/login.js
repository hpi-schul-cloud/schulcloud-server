const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../src/app');

chai.use(chaiHttp);

const getAccessToken = ({ username, password }) => (new Promise((resolve, reject) => {
	chai.request(app)
		.post('/authentication')
		.set('Accept', 'application/json')
		.set('content-type', 'application/x-www-form-urlencoded')
	// send credentials
		.send({ username, password })
		.end((err, res) => {
			if (err) {
				reject(err);
			} else {
				const token = res.body.accessToken;
				resolve(token);
			}
		});
}));

exports.getAccessToken = getAccessToken;

/**
 * Makes a request to the authentication API using the provided credentials to obtain a token
 * @param username
 * @param password
 * @returns {{authenticate: (function(*=))}} A function that authenticates chai-http requests using the obtained token
 */
exports.authenticateWithCredentials = ({ username, password }) => {
	const accessTokenPromise = getAccessToken({ username, password });
	const authenticate = (request) => accessTokenPromise
		.then((accessToken) => {
			request
				.set('Authorization', accessToken);
			return Promise.resolve(request);
		});
	return { authenticate };
};
