const { expect } = require('chai');
const appPromise = require('../../../src/app');

const testObjects = require('../helpers/testObjects')(appPromise);
const { equal: equalIds } = require('../../../src/helper/compare').ObjectId;
const { userModel } = require('../../../src/services/user/model');

describe.only('firstLogin Service', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
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
