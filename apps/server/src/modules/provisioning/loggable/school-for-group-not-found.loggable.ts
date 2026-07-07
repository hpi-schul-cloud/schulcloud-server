import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type ExternalGroupDto, type ExternalSchoolDto } from '../dto';

export class SchoolForGroupNotFoundLoggable implements Loggable {
	constructor(
		private readonly group: ExternalGroupDto,
		private readonly school: ExternalSchoolDto
	) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'Unable to provision group, since the connected school cannot be found.',
			data: {
				externalGroupId: this.group.externalId,
				externalOrganizationId: this.school.externalId,
			},
		};
	}
}
