import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage } from '@shared/common';
import { Loggable } from '@shared/common/loggable';
import { RoleReference } from '@shared/domain/domainobject';

export class AddSecondarySchoolToUsersRoleErrorLoggableException
	extends InternalServerErrorException
	implements Loggable
{
	constructor(private readonly payload: { roles: RoleReference[] }) {
		super('could not recognize any of the users roles when adding a secondary school');
	}

	getLogMessage(): ErrorLogMessage {
		const { roles } = this.payload;
		const roleNames = roles.map((role) => role.name).join(', ');

		const message: ErrorLogMessage = {
			type: 'INTERNAL_ERROR',
			stack: this.stack,
			data: {
				message: 'could not recognize any of the users roles when adding a secondary school',
				roleNames,
			},
		};

		return message;
	}
}
