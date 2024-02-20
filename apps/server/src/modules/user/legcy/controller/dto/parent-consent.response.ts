import { ApiProperty } from '@nestjs/swagger';
import { UserConsentResponse } from './user-consent.response';

export class ParentConsentResponse extends UserConsentResponse {
	constructor({
		_id,
		form,
		privacyConsent,
		termsOfUseConsent,
		dateOfPrivacyConsent,
		dateOfTermsOfUseConsent,
	}: ParentConsentResponse) {
		super({ form, privacyConsent, termsOfUseConsent, dateOfPrivacyConsent, dateOfTermsOfUseConsent });
		this._id = _id.toString();
	}

	@ApiProperty()
	_id: string;
}
