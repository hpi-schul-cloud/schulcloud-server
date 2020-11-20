const chai = require('chai');
const chaiHttp = require('chai-http');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { registrationPinRepo } = require('./index');

chai.use(chaiHttp);
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

	it('should return registrationPins', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const registrationPin = await testObjects.createTestRegistrationPin(registrationPinParams, user);
		const registrationPins = await registrationPinRepo.find(user.email, app);
		expect(registrationPins[0]).to.deep.equal(registrationPin);
	});

	it('should delete registrationPins', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const registrationPin = await testObjects.createTestRegistrationPin(registrationPinParams, user);
		let registrationPins = await registrationPinRepo.find(user.email, app);
		expect(registrationPins[0]).to.deep.equal(registrationPin);

		await registrationPinRepo.delete(registrationPins, app);
		registrationPins = await registrationPinRepo.find(user.email, app);
		expect(registrationPins).to.have.length(0);
	});
});
