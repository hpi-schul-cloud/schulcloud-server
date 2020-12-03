const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects');
const { registrationPinRepo } = require('.');
const { registrationPinModel } = require('../../../services/user/model');
const { GeneralError } = require('../../../errors');

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
	let testHelper;

	before(async () => {
		app = await appPromise;
		testHelper = testObjects(app);
		server = await app.listen(0);
	});

	afterEach(async () => {
		await testHelper.cleanup();
	});

	after(async () => {
		await server.close();
	});

	describe('deleteRegistrationPinForUser', () => {
		it('when registration pin is deleted, it should return deleted registration pin ids', async () => {
			const user = await testHelper.createTestUser();
			const registrationPin = await testHelper.createTestRegistrationPin(registrationPinParams, user);
			const result = await registrationPinRepo.deleteRegistrationPins([registrationPin._id]);
			expect(result.length).to.be.equal(1);
			expect(result[0]).to.be.equal(registrationPin._id);
		});

		it('when registration pin is deleted, it should be gone from db', async () => {
			const user = await testHelper.createTestUser();
			const registrationPin = await testHelper.createTestRegistrationPin(registrationPinParams, user);
			await registrationPinRepo.deleteRegistrationPins([registrationPin._id]);

			const result = await registrationPinModel.find({ email: user.email }).lean().exec();
			expect(result.length).to.be.equal(0);
		});

		it('when the function is called with invalid id, it throws an error', async () => {
			const notExistedId = new ObjectId();
			expect(registrationPinRepo.deleteRegistrationPins([notExistedId])).to.eventually.throw(new GeneralError());
		});
	});

	describe('getRegistrationPin', () => {
		it('when the function is called with user email, it should return list of registrationPins', async () => {
			const user = await testHelper.createTestUser();
			const testRegistrationPin = await testHelper.createTestRegistrationPin(registrationPinParams, user);
			const registrationPins = await registrationPinRepo.getRegistrationPinsForUser(user.email);
			expect(registrationPins[0]).to.deep.equal(testRegistrationPin);
		});

		it('when the function is called with email, for which registration pin doesnt exists, then it should return empty array', async () => {
			const user = await testHelper.createTestUser();
			const registrationPins = await registrationPinRepo.getRegistrationPinsForUser(user.email);
			expect(registrationPins.length).to.be.equal(0);
		});
	});
});
