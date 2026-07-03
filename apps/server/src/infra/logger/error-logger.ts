import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { Loggable } from './interfaces';
import { LoggingUtils } from './logging.utils';

// ErrorLogger may only be used in the ErrorModule. Do not use it in other modules!
@Injectable()
export class ErrorLogger {
	constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger) {}

	public emerg(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable);
		this.logger.emerg(message);
	}

	public alert(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable);
		this.logger.alert(message);
	}

	public crit(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable);
		this.logger.crit(message);
	}

	public error(loggable: Loggable): void {
		const message = LoggingUtils.createMessageWithContext(loggable);
		this.logger.error(message);
	}
}
