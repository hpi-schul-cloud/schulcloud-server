import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type ExternalGroupUserDto } from '../dto';

export class UserForGroupNotFoundLoggable implements Loggable {
	constructor(private readonly groupUser: ExternalGroupUserDto) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'Unable to add unknown user to group during provisioning.',
			data: {
				externalUserId: this.groupUser.externalUserId,
				roleName: this.groupUser.roleName,
			},
		};
	}
}
