const chai = require('chai');
const request = require('request-promise-native');
const app = require('../../src/app');
const getAllRoutes = require('../services/helpers/getAllRoutes');
const { whitelist, ignoreList } = require('./whitelist');
const { API_HOST } = require('../../config/globals');

const { expect } = chai;
const PORT = 5254;

const sleep = (time) => new Promise((res) => setTimeout(res, time));

const isOnWhitelist = (endpoint, method) => {
	if (endpoint in whitelist) {
		if (method in whitelist[endpoint].methods) {
			return true;
		}
	}
	return false;
};

const isOnIgnoreList = (endpoint, method) => {
	if (endpoint in ignoreList) {
		if (ignoreList[endpoint].methods.includes(method)) {
			/* eslint-disable-next-line */
			console.warn('fix me please');
			return true;
		}
	}
	return false;
};

const serverSetup = () => {
	let server;

	before((done) => {
		server = app.listen(PORT, done);
	});

	after((done) => {
		server.close(done);
	});
};

const createTests = (token) => {
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
						this.timeout(20000);
						await sleep(15000);
					}
					if (method === 'find') { method = 'get'; }

					const options = {
						uri: `http://localhost:${PORT}${detail.route}`,
						method,
						json: true,
						resolveWithFullResponse: true,
						headers,
					};

					if (!isOnIgnoreList(route, method)) {
						const status = await request(options)
							.then((res) => res.statusCode)
							.catch((error) => error.statusCode);

						if (isOnWhitelist(route, method)) {
							expect(status).to.equal(whitelist[route].methods[method]);
						} else {
							expect(status).to.be.oneOf([401, 405]);
						}
					}
				});
			}
		});
	}
};

describe('Call routes without jwt', () => createTests());
describe('Call routes with empty jwt', () => createTests(''));
describe('Call routes with invalid jwt', () => createTests('eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2Nv'));
