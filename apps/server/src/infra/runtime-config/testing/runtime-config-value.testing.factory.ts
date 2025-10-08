import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { RuntimeConfigValue, RuntimeConfigValueProps } from '../domain/runtime-config-value.do';

export const runtimeConfigTestingFactory = BaseFactory.define<RuntimeConfigValue, RuntimeConfigValueProps>(
	RuntimeConfigValue,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			key: `runtime_config_key_${sequence}`,
			type: 'string',
			value: `runtime_config_value_${sequence}`,
			description: `runtime_config_description_${sequence}`,
		};
	}
);
