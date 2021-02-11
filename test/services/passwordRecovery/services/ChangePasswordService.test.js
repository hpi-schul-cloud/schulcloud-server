const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const { expect } = require('chai');

const { SilentError } = require('../../../../src/errors');
const passwordRecovery = require('../../../../src/services/passwordRecovery/model');
const { ChangePasswordService } = require('../../../../src/services/passwordRecovery/services/ChangePasswordService');

chai.use(chaiAsPromised);

describe('ChangePasswordService', () => {
	afterEach(() => {
		sinon.restore();
	});

	it.skip('should fail if resetId is not a valid objectId', async () => {
		const changePasswordService = new ChangePasswordService(passwordRecovery);
		try {
			const result = await changePasswordService.create({ resetId: { $ne: 'X' }, password: '123' });
			throw new Error('Should throw an valid error.', { result });
		} catch (err) {
			expect(err.message).equal(changePasswordService.errors.inputValidation);
		}
	});

	it('should fail if resetId is missed', async () => {
		const changePasswordService = new ChangePasswordService(passwordRecovery);
		try {
			const result = await changePasswordService.create({ password: '123' });
			throw new Error('Should throw an valid error.', { result });
		} catch (err) {
			expect(err.message).equal(changePasswordService.errors.inputValidation);
		}
	});

	it('should fail if passowrd is missed', async () => {
		const changePasswordService = new ChangePasswordService(passwordRecovery);
		try {
			const result = await changePasswordService.create({ resetId: { $ne: 'X' } });
			throw new Error('Should throw an valid error.', { result });
		} catch (err) {
			expect(err.message).equal(changePasswordService.errors.inputValidation);
		}
	});

	it('should throw SilentError if token do not exist.', async () => {
		// given
		const passwordRecoveryModelMock = sinon.mock(passwordRecovery).expects('findOne').once().returns(null);
		const changePasswordService = new ChangePasswordService(passwordRecovery);

		// then
		await chai
			.expect(
				changePasswordService.create({
					accountId: 123,
					password: 'schulcloud',
					resetId: '5fa2c58892bacba679c204f8',
				})
			)
			.to.be.rejectedWith(SilentError, changePasswordService.errors.notExist);
		passwordRecoveryModelMock.verify();
	});

	it('should throw SilentError if password has been already changed', async () => {
		// given
		const passwordRecoveryModelMock = sinon.mock(passwordRecovery).expects('findOne').once().returns({
			changed: true,
		});
		const changePasswordService = new ChangePasswordService(passwordRecovery);

		// then
		await chai
			.expect(
				changePasswordService.create({
					accountId: 123,
					password: 'schulcloud',
					resetId: '5fa2c58892bacba679c204f8',
				})
			)
			.to.be.rejectedWith(SilentError, changePasswordService.errors.expired);
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

		const changePasswordService = new ChangePasswordService(passwordRecovery);

		// then
		await chai
			.expect(
				changePasswordService.create({
					accountId: 123,
					password: 'schulcloud',
					resetId: '5fa2c58892bacba679c204f8',
				})
			)
			.to.be.rejectedWith(SilentError, changePasswordService.errors.expired);
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

		const changePasswordService = new ChangePasswordService(passwordRecovery);

		// then
		await chai
			.expect(
				changePasswordService.create({
					accountId: 123,
					password: 'schulcloud',
					resetId: '5fa2c58892bacba679c204f8',
				})
			)
			.not.to.be.rejectedWith(SilentError, changePasswordService.errors.expired);
		passwordRecoveryModelMock.verify();
	});
});
