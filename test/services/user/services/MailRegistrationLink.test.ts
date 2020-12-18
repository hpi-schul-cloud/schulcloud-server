import { expect } from 'chai';
import appPromise from '../../../../src/app';
import testObjectsImport from '../../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);

const testGenericErrorMessage = 'Can not send mail(s) with registration link';

describe('MailRegistrationLinkService', () => {
	let app;
	let mailRegistrationLinkService;
	let server;

	before(async () => {
		app = await appPromise;
		mailRegistrationLinkService = app.service('/users/mail/registrationLink');
		server = app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	it('is properly registered', () => {
		expect(mailRegistrationLinkService).to.not.equal(undefined);
	});

	// https://ticketsystem.schul-cloud.org/browse/SC-5127
	xit('student can not create', async () => {
		const student = await testObjects.createTestUser({ roles: ['student'] });
		const params = await testObjects.generateRequestParamsFromUser(student);
		params.query = {};
		try {
			await mailRegistrationLinkService.create(params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.message).to.equal(testGenericErrorMessage);
			expect(err.code).to.equal(403);
		}
	});

	// https://ticketsystem.schul-cloud.org/browse/SC-5127
	xit('teacher can not create', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		try {
			await mailRegistrationLinkService.create(params);
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
