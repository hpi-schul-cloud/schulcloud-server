import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ExternalGroupUserDto } from '../dto';

export class UserForGroupNotFoundLoggable implements Loggable {
	constructor(private readonly groupUser: ExternalGroupUserDto) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to add unknown user to group during provisioning.',
			data: {
				externalUserId: this.groupUser.externalUserId,
				roleName: this.groupUser.roleName,
			},
		};
	}
}
