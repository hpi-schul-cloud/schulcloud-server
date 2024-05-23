import { SchulconnexSonstigeGruppenzugehoerigeResponse } from '@infra/schulconnex-client';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class GroupRoleUnknownLoggable implements Loggable {
	constructor(private readonly relation: SchulconnexSonstigeGruppenzugehoerigeResponse) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to add unknown user to group during provisioning.',
			data: {
				externalUserId: this.relation.ktid,
				externalRoleName: this.relation.rollen?.[0],
			},
		};
	}
}
