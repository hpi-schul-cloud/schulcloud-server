const { expect } = require('chai');
const app = require('../../../../src/app');
const { createTestSchool, cleanup } = require('../../helpers/testObjects')(app);

const registrationSchoolService = app.service('/registrationSchool');

describe.only('registrationSchool service', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	it('registered the registrationSchoolService', () => {
		expect(registrationSchoolService).to.not.equal(undefined);
	});

	it('registered the registrationSchoolService', async () => {
		const school = await createTestSchool();
		const result = await registrationSchoolService.get(school._id);
		expect(result._id.toString()).to.equal(school._id.toString());
	});

	after(async () => {
		await cleanup();
	});
});
