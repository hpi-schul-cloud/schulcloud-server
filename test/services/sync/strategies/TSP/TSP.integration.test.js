const { expect } = require('chai');

const app = require('../../../../../src/app');

const testObjects = require('../../../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../../../helpers/services/login')(app);
const { create: createUser } = require('../../../helpers/services/users')(app);
const { create: createSchool } = require('../../../helpers/services/schools')(app);

const { equal: equalIds } = require('../../../../../src/helper/compare').ObjectId;

const {
	findSchool,
} = require('../../../../../src/services/sync/strategies/TSP/TSP');

describe.only('TSP API integration tests', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	describe('#findSchool', () => {
		it('should find a school based on its TSP school identifier', async () => {
			const tspIdentifier = '47274';
			const school = await createSchool({ source: 'tsp', sourceOptions: { schoolIdentifier: tspIdentifier } });
			const foundSchool = await findSchool(app, tspIdentifier);
			expect(equalIds(school._id, foundSchool._id)).to.equal(true);
		});

		it('returns null if no school was found', async () => {
			const foundSchool = await findSchool(app, '63472');
			expect(foundSchool).to.equal(null);
		});

		after(testObjects.cleanup);
	});
});
