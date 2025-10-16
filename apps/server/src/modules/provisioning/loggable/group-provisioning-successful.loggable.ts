import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class GroupProvisioningSuccessfulLoggable implements Loggable {
	constructor(
		private readonly groupId: string,
		private readonly externalGroupId: string,
		private readonly systemId: string
	) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Group provisioning successful',
			data: {
				groupId: this.groupId,
				externalGroupId: this.externalGroupId,
				systemId: this.systemId,
			},
		};
	}
}
