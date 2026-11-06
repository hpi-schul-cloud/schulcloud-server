import { ApiProperty } from '@nestjs/swagger';
import { UserConsentResponse } from './user-consent.response';
import { ParentConsentResponse, type ParentConsentResponseProps } from './parent-consent.response';

export type ConsentsResponseProps = {
	userConsent?: UserConsentResponse;
	parentConsents?: ParentConsentResponseProps[];
};

export class ConsentsResponse {
	constructor({ userConsent, parentConsents }: ConsentsResponseProps) {
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
