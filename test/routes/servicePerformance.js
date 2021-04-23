const chai = require('chai');
const appPromise = require('../../src/app');
const testObjects = require('../services/helpers/testObjects');

const { expect } = chai;
const PORT = 5256;

const getCharNumber = (result, ressourceNumbers = 1) => JSON.stringify(result).length / ressourceNumbers;

const configuration = [
	{
		serviceName: 'schools',
		ressources: [{ name: 'schools', number: 100 }],
	},
];

const buildTest = (app, testHelper, TestEventEmitter, limits, config) => {
	describe(`[performance] ${config.serviceName} service`, () => {
		const method = 'find'; // s ['get', 'find']
		const service = app.service(config.serviceName);

		it(`[p] ${config.serviceName} ${method}`, async () => {
			let dbCalls = 0;
			// const timeIterations = 100;
			const $limit = service.paginate.max;

			TestEventEmitter.on('mongoose_test_calls', (data) => {
				dbCalls += 1;
			});

			const promises = [];
			config.ressources.forEach((ressource) => {
				for (let i = 0; i < ressource.number; i += 1) {
					promises.push(testHelper[ressource.name].create());
				}
			});
			await Promise.all(promises);

			const params = {
				query: {
					$limit,
				},
			};

			// iterations over the call for time messure do not work like expected
			// TODO: figure out if feathers cache stuff
			const start = Date.now();
			const result = await service[method](params); // move to external call
			const time = Date.now() - start;

			const charNumberByRessource = getCharNumber(result, $limit);
			// TODO: replace console.log in future
			console.log({
				service: config.serviceName,
				method,
				$limit,
				charNumberByRessource,
				time,
				dbCalls,
			});

			expect(dbCalls, 'To many database calls are needed.').below(limits.dbCalls);
			expect(time, 'Reponse time is to slow').below(limits.time);
			expect(charNumberByRessource, 'Response Kb size is to much.').below(limits.chars);
		});
	});
};

const main = (app) => {
	describe.only('metrics service call for specific services', () => {
		let server;
		const testHelper = testObjects(app);
		const { TestEventEmitter, performanceMessurceLimits: limits } = testHelper;

		before(async () => {
			server = await app.listen(PORT);
		});

		after(async () => {
			await testHelper.cleanup();
			await server.close();
		});

		configuration.forEach((config) => {
			buildTest(app, testHelper, TestEventEmitter, limits, config);
		});
	});
};

module.exports = main;
