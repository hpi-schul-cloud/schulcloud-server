import { ErrorLogMessage, Loggable } from '@infra/logger';
import { ForbiddenException } from '@nestjs/common';

export class FeatureDisabledLoggableException extends ForbiddenException implements Loggable {
	constructor(private readonly featureName: string) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'FEATURE_DISABLED',
			stack: this.stack,
			data: {
				featureName: this.featureName,
			},
		};

		return message;
	}
}
