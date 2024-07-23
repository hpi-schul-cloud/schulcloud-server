import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ExternalUserDto } from '../dto';

export class FetchingPoliciesInfoFailedLoggable implements Loggable {
	constructor(private readonly user: ExternalUserDto, private readonly policiesInfoEndpoint: string) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Could not fetch policies info for user. The provisioning of licenses will be skipped.',
			data: {
				externalUserId: this.user.externalId,
				policiesInfoEndpoint: this.policiesInfoEndpoint,
			},
		};
	}
}
