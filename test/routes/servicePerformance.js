const chai = require('chai');
const testObjects = require('../services/helpers/testObjects');

const { expect } = chai;
const PORT = 5256;

const getCharNumber = (result, ressourceNumbers = 1) => JSON.stringify(result).length / ressourceNumbers;

// TODO: should work for bundled ressources like school+users-> courses + classes -> lessons -> homeworks -> submissions
// TODO: should only call any ressource one time with max number
// TODO: call external request to see every hook, but maybe internal also nice to know
// TODO: call more then one request for each service ..without loop optimization from v8 engine
const configuration = [
	{
		serviceName: 'schools',
		ressources: [
			{ name: 'schools', number: 100 },
			// { name: 'years', number: 10 }, not needed, added in seed data
		],
	},
	{
		serviceName: 'users',
		ressources: [{ name: 'users', number: 1000 }],
	},
	{
		serviceName: 'classes',
		ressources: [
			{
				name: 'classes',
				number: 100,
				ressources: [
					{ name: 'users', number: 30, mappedTo: 'userIds', onlyId: true },
					{ name: 'users', number: 1, mappedTo: 'teacherIds', onlyId: true },
				],
			},
		],
	},
];

// TODO: replace console.log in future but winston do not work locally for me. Must figure out why.
const printInfo = (info) => {
	// eslint-disable-next-line no-console
	console.log(info);
};

// only find supported at the moment
const request = async (service, method, params) => {
	const result = await service[method](params);
	return result;
};

const getExample = (result) => {
	if (Array.isArray(result && result.data)) {
		return result.data[0];
	}
	return null;
};

const buildTest = (app, TestEventEmitter, limits, serviceName) => {
	describe(`[performance] ${serviceName} service`, () => {
		const method = 'find'; // ['get', 'find']; // TODO: get do not work
		const service = app.service(serviceName);

		it(`[p] ${serviceName} ${method}`, async () => {
			let dbCalls = 0;
			// const timeIterations = 100;
			const $limit = (service.paginate && service.paginate.max) || 1000;

			TestEventEmitter.on('mongoose_test_calls', () => {
				dbCalls += 1;
			});

			const params = {
				query: {
					$limit,
				},
			};

			// iterations over the call for time messure do not work like expected
			// TODO: figure out if feathers cache stuff
			const start = Date.now();
			const result = await request(service, method, params);
			const time = Date.now() - start;

			const charNumberByRessource = getCharNumber(result, $limit);

			printInfo({
				service: serviceName,
				method,
				$limit,
				charNumberByRessource,
				time,
				dbCalls,
				example: getExample(result), // find
			});

			expect(dbCalls, 'To many database calls are needed.').below(limits.dbCalls);
			expect(time, 'Reponse time is to slow').below(limits.time);
			expect(charNumberByRessource, 'Response Kb size is to much.').below(limits.chars);
		});
	});
};

const getIds = (data = []) => data.map(({ _id }) => _id);

const setupRessources = async (testHelper, setups) => {
	const result = [];
	for (let setupNumber = 0; setupNumber < setups.length; setupNumber += 1) {
		const setup = setups[setupNumber];
		const { ressources, name, number } = setup;
		const promises = [];
		const inputData = {};
		if (ressources) {
			// eslint-disable-next-line no-await-in-loop
			const subResult = await setupRessources(testHelper, ressources);
			subResult.forEach((subData) => {
				const d = subData.onlyId ? getIds(subData.data) : subData.data;
				inputData[subData.mappedTo || subData.name] = d;
			});
		}

		for (let iNumber = 0; iNumber < number; iNumber += 1) {
			promises.push(testHelper[name].create(inputData));
		}
		// eslint-disable-next-line no-await-in-loop
		const data = await Promise.all(promises);
		result.push({ ...setup, data });
	}
	return result;
};

const prepareConfigMap = async (testHelper, config) => {
	// do stuff before
	const promises = [];
	config.forEach((setup) => {
		promises.push(setupRessources(testHelper, setup.ressources));
	});

	const result = await Promise.all(promises);
	return result;
};

const main = (app) => {
	describe.only('metrics service call for specific services', () => {
		let server;
		const testHelper = testObjects(app);
		const { TestEventEmitter, performanceMessurceLimits: limits } = testHelper;

		before(async () => {
			server = await app.listen(PORT);
			await prepareConfigMap(testHelper, configuration);
		});

		after(async () => {
			await testHelper.cleanup();
			await server.close();
		});

		configuration.forEach((config) => {
			buildTest(app, TestEventEmitter, limits, config.serviceName);
		});
	});
};

module.exports = main;
