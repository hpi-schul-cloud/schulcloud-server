import { Loggable, LoggableMessage } from '@shared/common/loggable/interfaces';

export class PoliciesInfoErrorResponseLoggable implements Loggable {
	constructor(private readonly type: string, private readonly code: string, private readonly value: string) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'The /policies-info endpoint returned an error for a media source.',
			data: {
				type: this.type,
				code: this.code,
				value: this.value,
			},
		};
	}
}
