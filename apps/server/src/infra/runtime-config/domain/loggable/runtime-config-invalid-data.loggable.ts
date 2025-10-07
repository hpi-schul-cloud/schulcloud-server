import { Loggable } from '@shared/common/loggable';
import { ErrorLogMessage } from '@shared/common/error';
import { InternalServerErrorException } from '@nestjs/common';

export class RuntimeConfigValueInvalidDataLoggable extends InternalServerErrorException implements Loggable {
	constructor(private readonly key: string, private readonly value: unknown, private readonly type: string) {
		super('The database contains invalid or inconsistent Runtime Config Values.');
	}

	/* istanbul ignore next */
	public getLogMessage(): ErrorLogMessage {
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
