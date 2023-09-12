import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ExternalGroupDto } from '../dto';

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
