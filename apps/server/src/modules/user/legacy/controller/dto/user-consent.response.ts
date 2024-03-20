import { ApiProperty } from '@nestjs/swagger';

export class UserConsentResponse {
	constructor({
		form,
		privacyConsent,
		termsOfUseConsent,
		dateOfPrivacyConsent,
		dateOfTermsOfUseConsent,
	}: UserConsentResponse) {
		this.form = form;
		this.privacyConsent = privacyConsent;
		this.termsOfUseConsent = termsOfUseConsent;
		this.dateOfPrivacyConsent = dateOfPrivacyConsent;
		this.dateOfTermsOfUseConsent = dateOfTermsOfUseConsent;
	}

	@ApiProperty()
	form: string;

	@ApiProperty()
	privacyConsent: boolean;

	@ApiProperty()
	termsOfUseConsent: boolean;

	@ApiProperty()
	dateOfPrivacyConsent: Date;

	@ApiProperty()
	dateOfTermsOfUseConsent: Date;
}
