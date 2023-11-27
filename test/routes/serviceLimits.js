const chai = require('chai');
const getAllRoutes = require('../services/helpers/getAllRoutes');

const { expect } = chai;
const PORT = 5255;
const MAX_PAGINATION = 1001;

const selectForTest = (service) => {
	if (!service) {
		return false;
	}

	return true;
};

const main = (app) => {
	describe('[metrics] check max service limits', () => {
		let server;
		const routes = getAllRoutes(app);

		before(async () => {
			server = await app.listen(PORT);
		});

		after(async () => {
			await server.close();
		});

		for (const [serviceName] of Object.entries(routes)) {
			const service = app.service(serviceName);
			if (selectForTest(service)) {
				// TODO: test if all before hooks include disallow external
				it(`test pagination max limit for ${serviceName}`, () => {
					expect(service.paginate).to.not.equal('undefined');
					expect(service.paginate.max).below(MAX_PAGINATION);
				});
			}
		}
	});
};

module.exports = main;
