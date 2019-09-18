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

	it('CREATE a new datasource', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await generateRequestParamsFromUser(admin);
		const data = {
			config: { type: 'csv' },
			name: `test${Date.now()}`,
		};
		const result = await datasourcesService.create(data, params);
		expect(result).to.not.be.undefined;
		expect(result.config).to.exist;
		expect(result.config).to.haveOwnProperty('type');
		expect(result.name).to.exist;
		expect(result.createdBy.toString()).to.equal(admin._id.toString());
		expect(result.schoolId.toString()).to.equal(admin.schoolId.toString());
	});

	it('GET a datasource');
	it('FIND all datasources of the users school');
	it('PATCH a datasource');
	it('UPDATE a datasource');
	it('REMOVE a datasource');
	it('fails for student');
	it('fails for teacher');
	it('fails for different school');
});
