import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class LicenseProvisioningSuccessfulLoggable implements Loggable {
	constructor(private readonly userId: string, private readonly licenseCount: number) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'License provisioning successful',
			data: {
				userId: this.userId,
				licenseCount: this.licenseCount,
			},
		};
	}
}
