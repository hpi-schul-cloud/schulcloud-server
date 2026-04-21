import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage } from '@shared/common/error';
import { Loggable } from '@shared/common/loggable';
import type { RuntimeConfigType, RuntimeConfigValue } from '../runtime-config-value.do';

export class RuntimeConfigValueNotExpectedType extends InternalServerErrorException implements Loggable {
	constructor(private readonly expectedType: RuntimeConfigType, private readonly domainObject: RuntimeConfigValue) {
		super('Runtime Config Value is not of the expected Type.');
	}

	/* istanbul ignore next */
	public getLogMessage(): ErrorLogMessage {
		const message = {
			message: this.message,
			expectedType: this.expectedType,
			configType: this.domainObject.getTypeAndValue().type,
			key: this.domainObject.getKey(),
			type: 'RUNTIME_CONFIG_VALUE_NOT_EXPECTED_TYPE',
			stack: this.stack,
		};

		return message;
	}
}
