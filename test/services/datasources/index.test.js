const { expect } = require('chai');

const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);

const datasourcesService = app.service('datasources');

describe.only('datasources service', () => {
	let server;
	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	it('registered the datasources service', () => {
		expect(datasourcesService).to.not.be.undefined;
	});

	it('creates a new datasource', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await generateRequestParamsFromUser(admin);
		const result = await datasourcesService.create({ config: { type: 'csv' } }, params);
		expect(result).to.not.be.undefined;
		expect(result.config).to.exist;
		expect(result.config).to.haveOwnProperty('type');
		expect(result.createdBy.toString()).to.equal(admin._id.toString());
		expect(result.schoolId.toString()).to.equal(admin.schoolId.toString());
	});
});
