import { Loggable } from '@core/logger';
import { ErrorLogMessage } from '@core/logger/types';
import { InternalServerErrorException } from '@nestjs/common';
import { Error } from 'ldapjs';

export class H5PLibraryManagementErrorLoggable extends InternalServerErrorException implements Loggable {
	constructor(private readonly library: string, private readonly error: unknown) {
		super();
	}

	// istanbul ignore next
	public getLogMessage(): ErrorLogMessage {
		const logMessage = {
			error: this.error as Error,
			data: {
				library: this.library,
			},
			stack: this.stack,
			type: 'Install H5P Content Type Error',
		};

		return logMessage;
	}
}
