const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const { SilentError } = require('../../../../src/errors');
const passwordRecovery = require('../../../../src/services/passwordRecovery/model');
const { ChangePasswordService } = require('../../../../src/services/passwordRecovery/services/ChangePasswordService');

chai.use(chaiAsPromised);

describe('ChangePasswordService should', () => {
	let changePasswordService;

	afterEach(() => {
		sinon.restore();
	});

	it('should throw SilentError if password has been already changed', async () => {
		// given
		const passwordRecoveryModelMock = sinon.mock(passwordRecovery).expects('findOne').once().returns({
			changed: true,
		});
		changePasswordService = new ChangePasswordService(passwordRecovery);

		// then
		await chai
			.expect(
				changePasswordService.create({
					accountId: 123,
					password: 'schulcloud',
					resetId: 'fake_token',
				})
			)
			.to.be.rejectedWith(SilentError, 'Invalid token!');
		passwordRecoveryModelMock.verify();
	});

	it('should throw SilentError if token is older than six hours', async () => {
		// given
		const tokenDate = new Date();
		tokenDate.setHours(tokenDate.getHours() - 7);
		const passwordRecoveryModelMock = sinon.mock(passwordRecovery).expects('findOne').once().returns({
			changed: false,
			createdAt: tokenDate,
		});

		changePasswordService = new ChangePasswordService(passwordRecovery);

		// then
		await chai
			.expect(
				changePasswordService.create({
					accountId: 123,
					password: 'schulcloud',
					resetId: 'fake_token',
				})
			)
			.to.be.rejectedWith(SilentError, 'Token expired!');
		passwordRecoveryModelMock.verify();
	});

	it('should not throw SilentError if token is younger than six hours', async () => {
		// given
		const tokenDate = new Date();
		tokenDate.setHours(tokenDate.getHours() - 5);
		const passwordRecoveryModelMock = sinon.mock(passwordRecovery).expects('findOne').once().returns({
			changed: false,
			createdAt: tokenDate,
		});

		changePasswordService = new ChangePasswordService(passwordRecovery);

		// then
		await chai
			.expect(
				changePasswordService.create({
					accountId: 123,
					password: 'schulcloud',
					resetId: 'fake_token',
				})
			)
			.not.to.be.rejectedWith(SilentError, 'Token expired!');
		passwordRecoveryModelMock.verify();
	});
});
