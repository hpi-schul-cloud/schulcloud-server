import { ApiProperty } from '@nestjs/swagger';
import { UserConsentResponse } from './user-consent.response';
import { ParentConsentResponse } from './parent-consent.response';

export class ConsentsResponse {
	constructor({ userConsent, parentConsents }: ConsentsResponse) {
		this.userConsent = userConsent;
		this.parentConsents = parentConsents
			? parentConsents.map((parentConsent) => new ParentConsentResponse(parentConsent))
			: undefined;
	}

	@ApiProperty()
	userConsent?: UserConsentResponse;

	@ApiProperty({ type: [ParentConsentResponse] })
	parentConsents?: ParentConsentResponse[];
}
