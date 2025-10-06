import { BadRequest } from '@feathersjs/errors';

import type { RuntimeConfigValue } from '../runtime-config-value.do';
import { Loggable } from '@shared/common/loggable';
import { ErrorLogMessage } from '@shared/common/error';

export class RuntimeConfigValueInvalidTypeLoggable extends BadRequest implements Loggable {
	constructor(private readonly value: string | number | boolean, private readonly domainObject: RuntimeConfigValue) {
		super('The Value does not match the type of the RuntimeConfigValue.');
	}

	public getLogMessage(): ErrorLogMessage {
		const message = {
			message: this.message,
			newValue: this.value,
			configType: this.domainObject.getTypeAndValue().type,
			key: this.domainObject.key,
			type: 'RUNTIME_CONFIG_VALUE_INVALID_TYPE',
			stack: this.stack,
		};

		return message;
	}
}
