const { expect } = require('chai');
const logger = require('../../../../src/logger/index');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const mailRegistrationLinkService = app.service('/users/mail/registrationLink');

let testGenericErrorMessage = 'Can not send mail(s) with registration link';

describe('MailRegistrationLinkService', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	it('is properly registered', () => {
		expect(mailRegistrationLinkService).to.not.equal(undefined);
	});

	it('student can not create', async () => {
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

	after(async () => {
		await testObjects.cleanup();
	});
});
