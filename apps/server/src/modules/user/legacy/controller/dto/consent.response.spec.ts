import { ParentConsentResponse } from './parent-consent.response';
import { ConsentResponse } from './consent.response';
import { UserConsentResponse } from './user-consent.response';

describe(ConsentResponse.name, () => {
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
				const consentResponse = new ConsentResponse({
					userConsent,
					parentConsents: [parentConsent],
				} as ConsentResponse);

				expect(consentResponse.userConsent).toEqual(userConsent);
				expect(consentResponse.parentConsents?.length).toEqual(1);
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				expect(consentResponse.parentConsents[0]).toEqual(parentConsent);
			});
		});
	});
});
