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

	it('GET a datasource', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await generateRequestParamsFromUser(admin);
		const data = {
			config: { type: 'csv' },
			name: `test${Date.now()}`,
		};
		const datasource = await datasourcesService.create(data, params);
		params.query = {};
		const result = await datasourcesService.get(datasource._id, params);
		expect(result).to.not.be.undefined;
		expect(result.config).to.exist;
		expect(result.config).to.haveOwnProperty('type');
		expect(result.name).to.exist;
		expect(result.createdBy.toString()).to.equal(admin._id.toString());
		expect(result.schoolId.toString()).to.equal(admin.schoolId.toString());
	});

	it('FIND all datasources of the users school', async () => {
		const school = await testObjects.createTestSchool();
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
		const params = await generateRequestParamsFromUser(admin);

		const datasource01 = await datasourcesService.create({
			config: { type: 'csv' },
			name: `onetest${Date.now()}`,
		}, params);
		const datasource02 = await datasourcesService.create({
			config: { type: 'csv' },
			name: `othertest${Date.now()}`,
		}, params);

		params.query = {};
		const result = await datasourcesService.find(params);
		expect(result).to.not.be.undefined;
		expect(Array.isArray(result.data)).to.equal(true);
		expect(result.total).to.equal(2);
		const Ids = result.data.map((ds) => ds._id.toString());
		expect(Ids).to.include(datasource01._id.toString());
		expect(Ids).to.include(datasource02._id.toString());
	});

	it('PATCH a datasource', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await generateRequestParamsFromUser(admin);
		const data = {
			config: { type: 'csv' },
			name: `test${Date.now()}`,
		};
		const datasource = await datasourcesService.create(data, params);
		const name = `renamedTest${Date.now()}`;
		const result = await datasourcesService.patch(datasource._id, { name }, params);
		expect(result).to.not.be.undefined;
		expect(result.config).to.exist;
		expect(result.config).to.haveOwnProperty('type');
		expect(result.name).to.equal(name);
		expect(result.createdBy.toString()).to.equal(admin._id.toString());
		expect(result.schoolId.toString()).to.equal(admin.schoolId.toString());
	});

	it('UPDATE a datasource');

	it('REMOVE a datasource');

	it('fails for student');

	it('fails for teacher');

	it('fails for different school');
});
