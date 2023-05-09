import { Inject, Injectable } from '@nestjs/common';
import { WinstonLogger, WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Loggable } from './interfaces';
import { LoggingUtils } from './logging.utils';

// ErrorLogger may only be used in the ErrorModule. Do not use it in other modules!
@Injectable()
export class ErrorLogger {
	constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger) {}

	error(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable);
		this.logger.error(message);
	}
}
