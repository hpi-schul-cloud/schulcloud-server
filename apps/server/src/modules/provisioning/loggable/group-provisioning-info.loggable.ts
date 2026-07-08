import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type ExternalGroupDto } from '../dto';

export class GroupProvisioningInfoLoggable implements Loggable {
	constructor(
		private readonly groups: ExternalGroupDto[],
		private readonly durationMs: number,
		private readonly externalUserId: string
	) {}

	public getLogMessage(): LoggableMessage {
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
