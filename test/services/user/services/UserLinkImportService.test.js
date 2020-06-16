const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const usersLinkImportService = app.service('/users/linkImport');

const testGenericErrorMessage = 'Can not send mail(s) with registration link';

describe('UserLinkImportService', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	it('is properly registered', () => {
		expect(usersLinkImportService).to.not.equal(undefined);
	});

	// https://ticketsystem.schul-cloud.org/browse/SC-4606
	xit('student can not use link import service', async () => {
		const student = await testObjects.createTestUser({ roles: ['student'] });
		const params = await testObjects.generateRequestParamsFromUser(student);
		params.query = {};
		try {
			await usersLinkImportService.get('g28vM'); // TODO hash
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.message).to.equal(testGenericErrorMessage);
			expect(err.code).to.equal(403);
		}
	});

	// https://ticketsystem.schul-cloud.org/browse/SC-4606
	xit('teacher can not use link import service', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		try {
			await usersLinkImportService.get('g28vM'); // TODO hash
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.message).to.equal(testGenericErrorMessage);
			expect(err.code).to.equal(403);
		}
	});

	after(async () => {
		await testObjects.cleanup();
	});
});
