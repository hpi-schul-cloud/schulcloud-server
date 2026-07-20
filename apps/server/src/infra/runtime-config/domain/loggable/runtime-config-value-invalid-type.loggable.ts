import { BadRequest } from '@feathersjs/errors';

import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import type { RuntimeConfigValueLike } from '../runtime-config-value.types';

export class RuntimeConfigValueInvalidTypeLoggable extends BadRequest implements Loggable {
	constructor(
		private readonly value: string | number | boolean,
		private readonly domainObject: RuntimeConfigValueLike
	) {
		super('The Value does not match the type of the RuntimeConfigValue.');
	}

	/* istanbul ignore next */
	public getLogMessage(): LoggableMessage {
		const message = {
			message: this.message,
			newValue: this.value,
			configType: this.domainObject.getTypeAndValue().type,
			key: this.domainObject.getKey(),
			type: 'RUNTIME_CONFIG_VALUE_INVALID_TYPE',
			stack: this.stack,
		};

		return message;
	}
}
