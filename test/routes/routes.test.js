const chai = require('chai');
const request = require('request-promise-native');
const appPromise = require('../../src/app');
const getAllRoutes = require('../services/helpers/getAllRoutes');
const { whitelistNoJwt, whitelistInvalidJwt, ignorelistNoJwt, ignorelistInvalidJwt } = require('./whitelist');

const { expect } = chai;
const PORT = 5254;

const sleep = (time) => new Promise((res) => setTimeout(res, time));

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

const serverSetup = () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(PORT);
	});

	after((done) => {
		server.close(done);
	});
};

const createTests = (token, whitelist, ignorelist) => {
	serverSetup();
	const routes = getAllRoutes();
	let headers;
	if (token || token === '') {
		headers = { Authorization: token };
	}

	for (const [route, detail] of Object.entries(routes)) {
		// test every route
		describe(`${route}`, () => {
			for (let method of detail.methods) {
				// test every endpoint of route
				it(`${method}`, async function run() {
					// needed for post authentication otherwise too many requests error
					if (route === 'authentication' && method === 'post') {
						await sleep(15000);
					}
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

describe('Call routes without jwt', () => createTests(undefined, whitelistNoJwt, ignorelistNoJwt));
describe('Call routes with empty jwt', () => createTests('', whitelistNoJwt, ignorelistNoJwt));
describe('Call routes with invalid jwt', () =>
	createTests('eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2Nv', whitelistInvalidJwt, ignorelistInvalidJwt));
