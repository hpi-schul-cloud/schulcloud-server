const chai = require('chai');
const request = require('request-promise-native');
const getAllRoutes = require('../services/helpers/getAllRoutes');
const { whitelistNoJwt, whitelistInvalidJwt, ignorelistNoJwt, ignorelistInvalidJwt } = require('./whitelist');

const { expect } = chai;
const PORT = 5254;

const isOnWhitelist = (endpoint, method, whitelist) => {
	if (endpoint in whitelist) {
		if (method in whitelist[endpoint]) {
			return true;
		}
	}
	return false;
};

const isOnIgnorelist = (endpoint, method, ignorelist) => {
	if (endpoint in ignorelist) {
		if (ignorelist[endpoint].includes(method)) {
			/* eslint-disable-next-line */
			console.warn('fix me please');
			return true;
		}
	}
	return false;
};

const createTests = (app, token, whitelist, ignorelist) => {
	let server;

	before(async () => {
		server = await app.listen(PORT);
	});

	after((done) => {
		server.close(done);
	});

	const routes = getAllRoutes(app);
	let headers;
	if (token || token === '') {
		headers = { Authorization: token };
	}

	for (const [route, detail] of Object.entries(routes)) {
		// test every route
		describe(`${route}`, () => {
			for (let method of detail.methods) {
				// test every endpoint of route
				it(`${method}`, async () => {
					// needed for post authentication otherwise too many requests error
					/* if (route === 'authentication' && method === 'post') {
						this.timeout(20000);
						await sleep(15000);
					} */
					if (method === 'find') {
						method = 'get';
					}

					const options = {
						uri: `http://localhost:${PORT}${detail.route}`,
						method,
						json: true,
						resolveWithFullResponse: true,
						headers,
					};

					if (!isOnIgnorelist(route, method, ignorelist)) {
						const status = await request(options)
							.then((res) => res.statusCode)
							.catch((error) => error.statusCode);

						if (isOnWhitelist(route, method, whitelist)) {
							expect(status).to.equal(whitelist[route][method]);
						} else {
							expect(status).to.be.oneOf([401, 405]);
						}
					}
				});
			}
		});
	}
};

const main = (app) => {
	describe('[metrics] Call routes without jwt', () => createTests(app, undefined, whitelistNoJwt, ignorelistNoJwt));
	describe('[metrics] Call routes with empty jwt', () => createTests(app, '', whitelistNoJwt, ignorelistNoJwt));
	describe('[metrics] Call routes with invalid jwt', () =>
		createTests(app, 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2Nv', whitelistInvalidJwt, ignorelistInvalidJwt));
};

module.exports = main;
