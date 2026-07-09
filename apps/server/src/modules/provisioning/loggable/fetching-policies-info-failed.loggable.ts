import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type ExternalUserDto } from '../dto';

export class FetchingPoliciesInfoFailedLoggable implements Loggable {
	constructor(
		private readonly user: ExternalUserDto,
		private readonly policiesInfoEndpoint: string
	) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Could not fetch policies info for user. The provisioning of licenses will be skipped.',
			data: {
				externalUserId: this.user.externalId,
				policiesInfoEndpoint: this.policiesInfoEndpoint,
			},
		};
	}
}
