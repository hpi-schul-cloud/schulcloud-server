const chai = require('chai');
const request = require('request-promise-native');
const chaiHttp = require('chai-http');
const getAllRoutes = require('../services/helpers/getAllRoutes');
const whitelist = require('./whitelist');
const { HOST } = require('../../config/globals');

chai.use(chaiHttp);

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
	if ((status === 401) || (status === 405) || (status === 400)) {
		return true;
	}
	return isOnWhitelist(endpoint, method, status);
};

describe('Routs', () => {
	const routes = getAllRoutes();
	for (const [route, detail] of Object.entries(routes)) {
		describe.only(`${route}`, () => {
			for (let method of detail.methods) {
				it(`${method}`, async () => {
					if (method === 'find') { method = 'get'; }
					const options = {
						uri: `http://${HOST}${detail.route}`,
						method,
						json: true,
						resolveWithFullResponse: true,
					};

					await request(options)
						.then((res) => {
							expect(res.statusCode).to.satisfies((status) => acceptedResults(status, route, method));
						})
						.catch((error) => {
							expect(error.statusCode).to.satisfies((status) => acceptedResults(status, route, method));
						});
				});
			}
		});
	}
});
