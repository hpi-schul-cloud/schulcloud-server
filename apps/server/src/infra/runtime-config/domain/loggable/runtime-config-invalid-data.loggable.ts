import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class RuntimeConfigValueInvalidDataLoggable extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly key: string,
		private readonly value: unknown,
		private readonly type: string
	) {
		super('The database contains invalid or inconsistent Runtime Config Values.');
	}

	/* istanbul ignore next */
	public getLogMessage(): LoggableMessage {
		const message = {
			message: this.message,
			value: this.value,
			configType: this.type,
			key: this.key,
			type: 'RUNTIME_CONFIG_INVALID_DATA',
			stack: this.stack,
		};

		return message;
	}
}
