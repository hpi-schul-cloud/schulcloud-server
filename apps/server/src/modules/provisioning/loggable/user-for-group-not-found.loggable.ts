import { Loggable } from '@src/core/logger/interfaces/loggable';
import { LogMessage, ErrorLogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';
import { ExternalGroupUserDto } from '../dto/external-group-user.dto';

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
