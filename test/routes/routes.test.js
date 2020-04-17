const chai = require('chai');
const request = require('request-promise-native');
const getAllRoutes = require('../services/helpers/getAllRoutes');
const whitelist = require('./whitelist');
const { API_HOST } = require('../../config/globals');

const { expect } = chai;

const isOnWhitelist = (endpoint, method, status) => {
	if (endpoint in whitelist) {
		if (method in whitelist[endpoint].methods) {
			return (whitelist[endpoint].methods[method] === status);
		}
	}
	return false;
};

const acceptedResults = (status, endpoint, method) => {
	if ((status === 401) || (status === 405)) {
		return true;
	}
	return isOnWhitelist(endpoint, method, status);
};

const createTests = (token) => {
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
				it(`${method}`, async () => {
					if (method === 'find') { method = 'get'; }

					const options = {
						uri: `${API_HOST}${detail.route}`,
						method,
						json: true,
						resolveWithFullResponse: true,
						headers,
					};

					const status = await request(options)
						.then((res) => res.statusCode)
						.catch((error) => error.statusCode);

					expect(status).to.satisfies((s) => acceptedResults(s, route, method));
				});
			}
		});
	}
};

describe('Call routes without jwt', () => createTests());

// describe('Call routes with empty jwt', () => {
// 	createTests('');
// });

// describe('Call routes with invalid jwt', () => {
// 	createTests('eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2Nv');
// });
