import { SchulconnexPoliciesInfoErrorResponse } from '@infra/schulconnex-client';
import { Loggable, LoggableMessage } from '@shared/common/loggable/interfaces';

export class PoliciesInfoErrorResponseLoggable implements Loggable {
	constructor(private readonly item: SchulconnexPoliciesInfoErrorResponse) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'The /policies-info endpoint returned an error for a media source.',
			data: {
				type: this.item.access_control['@type'],
				code: this.item.access_control.error.code,
				value: this.item.access_control.error.value,
			},
		};
	}
}
