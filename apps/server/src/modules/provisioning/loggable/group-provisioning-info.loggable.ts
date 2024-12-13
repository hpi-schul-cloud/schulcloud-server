import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ExternalGroupDto, ExternalUserDto } from '../dto';

export class GroupProvisioningInfoLoggable implements Loggable {
	constructor(
		private readonly groupUser: ExternalUserDto,
		private readonly groups: ExternalGroupDto[],
		private readonly durationMs: number
	) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const userCount = this.groups.reduce(
			(count: number, group: ExternalGroupDto) => count + (group.otherUsers?.length ?? 0),
			this.groups.length
		);

		return {
			message: 'Group provisioning has finished.',
			data: {
				externalUserId: this.groupUser.externalId,
				groupCount: this.groups.length,
				userCount,
				durationMs: this.durationMs,
			},
		};
	}
}
