import { Loggable } from '@src/core/logger/interfaces/loggable';
import { LogMessage, ErrorLogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';
import { SanisSonstigeGruppenzugehoerigeResponse } from '../strategy/sanis/response/sanis-sonstige-gruppenzugehoerige-response';

export class GroupRoleUnknownLoggable implements Loggable {
	constructor(private readonly relation: SanisSonstigeGruppenzugehoerigeResponse) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to add unknown user to group during provisioning.',
			data: {
				externalUserId: this.relation.ktid,
				externalRoleName: this.relation.rollen[0],
			},
		};
	}
}
