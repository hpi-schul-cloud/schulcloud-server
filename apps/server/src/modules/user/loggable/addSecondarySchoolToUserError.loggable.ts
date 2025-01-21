import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, ValidationErrorLogMessage } from '@shared/common/error';
import { Loggable } from '@shared/common/loggable';
import { RoleReference } from '@shared/domain/domainobject';
import { LogMessage } from '@src/core/logger';

export class AddSecondarySchoolToUsersRoleErrorLoggableException
	extends InternalServerErrorException
	implements Loggable
{
	constructor(private readonly payload: { roles: RoleReference[] }) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const { roles } = this.payload;
		const roleNames = roles.map((role) => role.name).join(', ');

		const message = {
			type: 'INTERNAL_ERROR',
			message: 'could not recognize any of the users roles when adding a secondary school',
			stack: this.stack,
			data: {
				roleNames,
			},
		};

		return message;
	}
}
