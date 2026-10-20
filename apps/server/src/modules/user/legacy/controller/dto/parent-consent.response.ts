import { ApiProperty } from '@nestjs/swagger';
import { type ObjectId } from '@mikro-orm/mongodb';
import { UserConsentResponse } from './user-consent.response';

export type ParentConsentResponseProps = Omit<ParentConsentResponse, '_id'> & { _id: string | ObjectId };

export class ParentConsentResponse extends UserConsentResponse {
	constructor({
		_id,
		form,
		privacyConsent,
		termsOfUseConsent,
		dateOfPrivacyConsent,
		dateOfTermsOfUseConsent,
	}: ParentConsentResponseProps) {
		super({ form, privacyConsent, termsOfUseConsent, dateOfPrivacyConsent, dateOfTermsOfUseConsent });
		this._id = _id.toString();
	}

	@ApiProperty()
	_id: string;
}
