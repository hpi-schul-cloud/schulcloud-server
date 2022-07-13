const { expect } = require('chai');
const appPromise = require('../../../src/app');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

const testObjects = require('../helpers/testObjects')(appPromise());
const { userModel } = require('../../../src/services/user/model');

describe('firstLogin Service', () => {
	let app;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('consent update', () => {
		it('parentConsent is not deleted when updating userConsent', async () => {
			const user = await testObjects.createTestUser();
			await userModel
				.findByIdAndUpdate(user._id, {
					'consent.userConsent': {
						form: 'digital',
						privacyConsent: false,
						termsOfUseConsent: false,
						dateOfPrivacyConsent: Date.now() - 3600,
						dateOfTermsOfUseConsent: Date.now() - 3600,
					},
					'consent.parentConsents': [
						{
							privacyConsent: false,
							termsOfUseConsent: false,
							dateOfPrivacyConsent: Date.now() - 3600,
							dateOfTermsOfUseConsent: Date.now() - 3600,
						},
					],
				})
				.lean()
				.exec();
			const params = await testObjects.generateRequestParamsFromUser(user);

			await app.service('firstLogin').create(
				{
					privacyConsentVersion: 'true',
					termsOfUseConsentVersion: 'true',
				},
				params
			);

			const updatedUser = await userModel.findById(user._id).lean().exec();
			expect(updatedUser.consent.userConsent.termsOfUseConsent).to.be.true;
			expect(updatedUser.consent.parentConsents).to.not.be.undefined;
			expect(updatedUser.consent.parentConsents[0].termsOfUseConsent).to.be.false;
		});
	});
});
