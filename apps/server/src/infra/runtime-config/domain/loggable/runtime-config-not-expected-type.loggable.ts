import type { RuntimeConfigValue, RuntimeConfigValueType } from '../runtime-config-value.do';
import { Loggable } from '@shared/common/loggable';
import { ErrorLogMessage } from '@shared/common/error';
import { InternalServerErrorException } from '@nestjs/common';

export class RuntimeConfigValueNotExpectedType extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly expectedType: RuntimeConfigValueType,
		private readonly domainObject: RuntimeConfigValue
	) {
		super('Runtime Config Value is not of the expected Type.');
	}

	public getLogMessage(): ErrorLogMessage {
		const message = {
			message: this.message,
			expectedType: this.expectedType,
			configType: this.domainObject.getTypeAndValue().type,
			key: this.domainObject.key,
			type: 'RUNTIME_CONFIG_VALUE_NOT_EXPECTED_TYPE',
			stack: this.stack,
		};

		return message;
	}
}
