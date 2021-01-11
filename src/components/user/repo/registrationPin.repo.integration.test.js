const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { registrationPinRepo } = require('.');
const { ValidationError } = require('../../../errors');

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
		it('when registration pin is deleted, it should return deleted registration pin ids', async () => {
			const user = await testObjects.createTestUser();
			await testObjects.createTestRegistrationPin(registrationPinParams, user);
			const result = await registrationPinRepo.deleteRegistrationPinsByEmail(user.email);
			expect(result.success).to.be.equal(true);
			expect(result.deletedDocuments).to.be.equal(1);
		});

		it('when registration pin is deleted, it should be gone from db', async () => {
			const user = await testObjects.createTestUser();
			const registrationPin1 = await testObjects.createTestRegistrationPin(registrationPinParams, user);

			const user2 = await testObjects.createTestUser();
			const registrationPin2 = await testObjects.createTestRegistrationPin(registrationPinParams, user2);
			let registrationPins = await registrationPinRepo.getRegistrationPinsForUser(user.email);
			expect(registrationPins).to.be.an('array').of.length(1);
			expect(registrationPins[0]._id.toString()).to.be.equal(registrationPin1._id.toString());

			await registrationPinRepo.deleteRegistrationPinsByEmail(user.email);

			registrationPins = await registrationPinRepo.getRegistrationPinsForUser(user.email);
			expect(registrationPins).to.be.an('array').of.length(0);

			const userPseudonyms2 = await registrationPinRepo.getRegistrationPinsForUser(user2.email);
			expect(userPseudonyms2).to.be.an('array').of.length(1);
			expect(userPseudonyms2[0]._id.toString()).to.be.equal(registrationPin2._id.toString());
		});

		it('when the function is called with valid email, it returns empty result object', async () => {
			const result = await registrationPinRepo.deleteRegistrationPinsByEmail('valid@email.com');
			expect(result.success).to.be.equal(true);
			expect(result.deletedDocuments).to.be.equal(0);
		});

		it('when the function is called with empty email, it throws an error', async () => {
			expect(registrationPinRepo.deleteRegistrationPinsByEmail(undefined)).to.eventually.be.rejectedWith(
				ValidationError
			);
		});
	});

	describe('getRegistrationPin', () => {
		it('when the function is called with user email, it should return list of registrationPins', async () => {
			const user = await testObjects.createTestUser();
			const testRegistrationPin = await testObjects.createTestRegistrationPin(registrationPinParams, user);
			const registrationPins = await registrationPinRepo.getRegistrationPinsForUser(user.email);
			expect(registrationPins[0]).to.deep.equal(testRegistrationPin);
		});

		it('when the function is called with email, for which registration pin doesnt exists, then it should return empty array', async () => {
			const user = await testObjects.createTestUser();
			const registrationPins = await registrationPinRepo.getRegistrationPinsForUser(user.email);
			expect(registrationPins.length).to.be.equal(0);
		});
	});
});
