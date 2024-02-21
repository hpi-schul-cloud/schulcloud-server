import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ExternalGroupDto, ExternalSchoolDto } from '../dto';

export class SchoolForGroupNotFoundLoggable implements Loggable {
	constructor(private readonly group: ExternalGroupDto, private readonly school: ExternalSchoolDto) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to provision group, since the connected school cannot be found.',
			data: {
				externalGroupId: this.group.externalId,
				externalOrganizationId: this.school.externalId,
			},
		};
	}
}
