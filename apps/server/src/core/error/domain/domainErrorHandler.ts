import { Injectable } from '@nestjs/common';
import util from 'util';
import { ErrorLogger, Loggable, LoggingUtils } from '../../logger'; // TODO: alias oder relativer Pfad zwischen den einzelnen Core Bereichen?
import { ErrorLoggable } from '../loggable';

@Injectable()
export class DomainErrorHandler {
	constructor(private readonly logger: ErrorLogger) {}

	public exec(error: unknown): void {
		const loggable = this.createErrorLoggable(error);
		this.logger.error(loggable);
	}

	private createErrorLoggable(error: unknown): Loggable {
		let loggable: Loggable;

		if (LoggingUtils.isInstanceOfLoggable(error)) {
			loggable = error;
		} else if (error instanceof Error) {
			loggable = new ErrorLoggable(error);
		} else {
			const unknownError = new Error(util.inspect(error));
			loggable = new ErrorLoggable(unknownError);
		}

		return loggable;
	}
}
