import { ParentConsentResponse } from './parent-consent.response';
import { UsersConsentResponse } from './users-consent.response';
import { UserConsentResponse } from './user-consent.response';

describe(UsersConsentResponse.name, () => {
	describe('constructor', () => {
		describe('When constructor is called', () => {
			const setup = () => {
				const userConsent = new UserConsentResponse({
					form: 'test',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date(),
					dateOfTermsOfUseConsent: new Date(),
				} as UserConsentResponse);

				const parentConsent = new ParentConsentResponse({
					form: 'test',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date(),
					dateOfTermsOfUseConsent: new Date(),
					_id: '0000d213816abba584710000',
				} as ParentConsentResponse);

				return {
					userConsent,
					parentConsent,
				};
			};

			it('should create a class by passing required properties', () => {
				const { userConsent, parentConsent } = setup();
				const consentResponse = new UsersConsentResponse({
					userConsent,
					parentConsents: [parentConsent],
				} as UsersConsentResponse);

				expect(consentResponse.userConsent).toEqual(userConsent);
				expect(consentResponse.parentConsents?.length).toEqual(1);
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				expect(consentResponse.parentConsents[0]).toEqual(parentConsent);
			});
		});
	});
});
