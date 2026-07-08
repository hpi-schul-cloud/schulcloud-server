import { ForbiddenException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '../loggable/interfaces';

export class FeatureDisabledLoggableException extends ForbiddenException implements Loggable {
	constructor(private readonly featureName: string) {
		super();
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: 'FEATURE_DISABLED',
			stack: this.stack,
			data: {
				featureName: this.featureName,
			},
		};

		return message;
	}
}
