import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { SanisSonstigeGruppenzugehoerigeResponse } from '@infra/schulconnex-client';

export class GroupRoleUnknownLoggable implements Loggable {
	constructor(private readonly relation: SanisSonstigeGruppenzugehoerigeResponse) {}

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
