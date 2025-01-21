import { ForbiddenException } from '@nestjs/common';
import { Loggable } from '@core/logger/interfaces';
import { ErrorLogMessage } from '@core/logger/types';

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
