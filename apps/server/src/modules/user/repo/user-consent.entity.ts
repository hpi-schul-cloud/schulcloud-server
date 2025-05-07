import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class UserConsentEntity {
	@Property()
	form: string;

	@Property()
	privacyConsent: boolean;

	@Property()
	termsOfUseConsent: boolean;

	@Property()
	dateOfPrivacyConsent: Date;

	@Property()
	dateOfTermsOfUseConsent: Date;

	constructor(props: UserConsentEntity) {
		this.form = props.form;
		this.privacyConsent = props.privacyConsent;
		this.termsOfUseConsent = props.termsOfUseConsent;
		this.dateOfPrivacyConsent = props.dateOfPrivacyConsent;
		this.dateOfTermsOfUseConsent = props.dateOfTermsOfUseConsent;
	}
}
