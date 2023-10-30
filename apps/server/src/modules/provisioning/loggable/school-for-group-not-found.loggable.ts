import { Loggable } from '@src/core/logger/interfaces/loggable';
import { LogMessage, ErrorLogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';
import { ExternalGroupDto } from '../dto/external-group.dto';

export class SchoolForGroupNotFoundLoggable implements Loggable {
	constructor(private readonly group: ExternalGroupDto) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to provision group, since the connected school cannot be found.',
			data: {
				externalGroupId: this.group.externalId,
				externalOrganizationId: this.group.externalOrganizationId,
			},
		};
	}
}
