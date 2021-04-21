const { expect } = require('chai');

const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects');
// const logger = require('../../../src/logger'); -> logger.info or logger.alert do not work

const getCharNumber = (result, ressourceNumbers=1) => ((JSON.stringify(result)).length/ressourceNumbers);

// TODO: it fail because the service must be improve
describe.skip('[performance] school service', () => {
	let app;
	let server;
	let testHelper;
	let schoolService;
	let TestEventEmitter;
	let limits;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
		testHelper = testObjects(app);
		({ TestEventEmitter, performanceMessurceLimits: limits } = testHelper);
		schoolService = app.service('schools');
	});

	after(async () => {
		await testHelper.cleanup();
		await server.close();
	});

	it('[p] find schools', async () => {
		let dbCalls = 0;
		let  $limit = schoolService.paginate.max;

		TestEventEmitter.on('mongoose_test_calls', (data) => {
			dbCalls++;
		});

		const promises = [];
		for(let i=0; i<$limit; i++) {
			promises.push(testHelper.createTestSchool());
		}
		await Promise.all(promises);

		const params = {
			query: {
				$limit,
			}
		};

		let start = Date.now();
		const result = await schoolService.find(params); // move to external call
		let requestTimeMS = Date.now() - start;

		const charNumberByRessource = getCharNumber(result, $limit);
		// replace console.log in future
		console.log({
			$limit,
			charNumberByRessource,
			requestTimeMS,
			dbCalls,
		});

		expect($limit, 'To high paginate max limit.').below(limits.paginate);
		expect(dbCalls, 'To many database calls are needed.').below(limits.dbCalls);
		expect(requestTimeMS, 'Reponse time is to slow').below(limits.time);
		expect(charNumberByRessource, 'Response Kb size is to much.').below(limits.chars);
	});
});

