import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { ExternalGroupDto } from '../dto';

export class GroupProvisioningInfoLoggable implements Loggable {
	constructor(
		private readonly groups: ExternalGroupDto[],
		private readonly durationMs: number,
		private readonly externalUserId: string
	) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const userCount = this.groups.reduce(
			(count: number, group: ExternalGroupDto) => count + (group.otherUsers?.length ?? 0),
			this.groups.length
		);

		return {
			message: 'Group provisioning has finished.',
			data: {
				groupCount: this.groups.length,
				userCount,
				durationMs: this.durationMs,
				externalUserId: this.externalUserId,
			},
		};
	}
}
