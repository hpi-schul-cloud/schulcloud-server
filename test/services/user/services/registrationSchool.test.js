const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const { createTestSchool, createTestClass, createTestTeamWithOwner, cleanup } = require('../../helpers/testObjects')(
	appPromise
);

describe('registrationSchool service', () => {
	let app;
	let registrationSchoolService;
	let server;

	before(async () => {
		app = await appPromise;
		registrationSchoolService = app.service('/registrationSchool');
		server = await app.listen();
	});

	after((done) => {
		server.close(done);
	});

	it('registered the registrationSchoolService', () => {
		expect(registrationSchoolService).to.not.equal(undefined);
	});

	it('get school', async () => {
		const school = await createTestSchool();
		const result = await registrationSchoolService.get(school._id);
		expect(result._id.toString()).to.equal(school._id.toString());
	});

	it('get school from classId', async () => {
		const school = await createTestSchool();
		const klass = await createTestClass({ schoolId: school._id });
		const result = await registrationSchoolService.get(klass._id);
		expect(result._id.toString()).to.equal(school._id.toString());
	});

	it('get school from teamId', async () => {
		const expertSchoolId = '5f2987e020834114b8efd6f9';
		const { team } = await createTestTeamWithOwner();
		const result = await registrationSchoolService.get(team._id);
		expect(result._id.toString()).to.equal(expertSchoolId);
	});

	after(async () => {
		await cleanup();
	});
});
