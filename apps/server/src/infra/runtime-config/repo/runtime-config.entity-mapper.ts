import { RuntimeConfigValueInvalidDataLoggable } from '../domain/loggable/runtime-config-invalid-data.loggable';
import { RuntimeConfigValue, RuntimeConfigValueAndType } from '../domain/runtime-config-value.do';
import { RuntimeConfigEntity } from './entity/runtime-config.entity';
import { RuntimeConfigValueFactory } from './runtime-config-value.factory';

export class RuntimeConfigEntityMapper {
	public static toDomainObject(entity: RuntimeConfigEntity): RuntimeConfigValue {
		const typeAndValue = this.getTypeAndValue(entity);
		return RuntimeConfigValueFactory.build({
			id: entity.id,
			key: entity.key,
			...typeAndValue,
			description: entity.description,
		});
	}

	private static getTypeAndValue(entity: RuntimeConfigEntity): RuntimeConfigValueAndType {
		if (entity.type === 'string') {
			return { type: 'string', value: entity.value };
		}
		if (entity.type === 'number') {
			const value = Number(entity.value);
			if (isNaN(value)) {
				throw new RuntimeConfigValueInvalidDataLoggable(entity.key, entity.value, entity.type);
			}
			return { type: 'number', value: Number(entity.value) };
		}
		if (entity.type === 'boolean') {
			return { type: 'boolean', value: entity.value === 'true' };
		}
		throw new RuntimeConfigValueInvalidDataLoggable(entity.key, entity.value, entity.type);
	}

	public static toEntityProperties(domainObject: RuntimeConfigValue): Partial<RuntimeConfigEntity> {
		const props = domainObject.getProps();
		return {
			key: props.key,
			type: props.type,
			value: props.value.toString(),
			description: props.description,
		};
	}
}
