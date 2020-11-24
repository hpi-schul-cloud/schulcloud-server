const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { registrationPinRepo } = require('.');
const { registrationPinModel } = require('../../../services/user/model');
const { NotFound } = require('../../../errors');

chai.use(chaiAsPromised);

const { expect } = chai;

const registrationPinParams = {
	pin: 'USER_PIN',
	verified: true,
	importHash: 'USER_IMPORT_HASH',
};

describe('registration pin repo', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});

	describe('deleteRegistrationPinForUser', () => {
		it('when registration pin is deleted, it should return deleted object', async () => {
			const user = await testObjects.createTestUser();
			const testRegistrationPin = await testObjects.createTestRegistrationPin(registrationPinParams, user);

			const result = await registrationPinRepo.deleteRegistrationPinForUser(user.email);
			expect(result).to.not.be.undefined;
			expect(result._id.toString()).to.equal(testRegistrationPin._id.toString());
		});

		it('when registration pin is deleted, it should be gone from db', async () => {
			const user = await testObjects.createTestUser();
			const testRegistrationPin = await testObjects.createTestRegistrationPin(registrationPinParams, user);

			await registrationPinRepo.deleteRegistrationPinForUser(user.email);

			const result = await registrationPinModel.findById(testRegistrationPin._id).lean().exec();
			expect(result).to.be.null;
		});
	});

	describe('getRegistrationPin', () => {
		it('when the function is called with user email, it should return registrationPin', async () => {
			const user = await testObjects.createTestUser();
			const testRegistrationPin = await testObjects.createTestRegistrationPin(registrationPinParams, user);
			const registrationPin = await registrationPinRepo.getRegistrationPin(user.email);
			expect(registrationPin).to.deep.equal(testRegistrationPin);
		});

		it('when the function is called with email, for which registration pin doesnt exists, then it should throw 404', async () => {
			const user = await testObjects.createTestUser();
			expect(registrationPinRepo.getRegistrationPin(user.email)).to.eventually.throw(new NotFound());
		});
	});
});
