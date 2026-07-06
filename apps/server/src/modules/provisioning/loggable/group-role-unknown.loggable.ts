import { SchulconnexSonstigeGruppenzugehoerigeResponse } from '@infra/schulconnex-client';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class GroupRoleUnknownLoggable implements Loggable {
	constructor(private readonly relation: SchulconnexSonstigeGruppenzugehoerigeResponse) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'Unable to add unknown user to group during provisioning.',
			data: {
				externalUserId: this.relation.ktid,
				externalRoleName: this.relation.rollen?.[0],
			},
		};
	}
}
