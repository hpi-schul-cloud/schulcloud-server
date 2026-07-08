import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class LicenseProvisioningSuccessfulLoggable implements Loggable {
	constructor(
		private readonly userId: string,
		private readonly licenseCount: number
	) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'License provisioning successful',
			data: {
				userId: this.userId,
				licenseCount: this.licenseCount,
			},
		};
	}
}
