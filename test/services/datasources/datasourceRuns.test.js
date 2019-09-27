const { expect } = require('chai');

const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);
const { datasourceModel } = require('../../../src/services/datasources/model');

const datasourceRunsService = app.service('datasourceRuns');

describe.only('datasourceRuns service', () => {
	let server;
	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	it('registered the datasourceRuns service', () => {
		expect(datasourceRunsService).to.not.be.undefined;
	});
});
