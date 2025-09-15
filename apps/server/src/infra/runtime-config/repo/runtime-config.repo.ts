import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { RuntimeConfigValue, RuntimeConfigValueAndType } from '../domain/runtime-config-value.do';
import { RuntimeConfigEntity } from './entity/runtime-config.entity';
import { RuntimeConfigRepo } from '../domain/runtime-config.repo.interface';
import { EntityData, EntityName } from '@mikro-orm/core/typings';

@Injectable()
export class RuntimeConfigMikroOrmRepo
	extends BaseDomainObjectRepo<RuntimeConfigValue, RuntimeConfigEntity>
	implements RuntimeConfigRepo
{
	get entityName(): EntityName<RuntimeConfigEntity> {
		return RuntimeConfigEntity;
	}

	public async getByKey(key: string): Promise<RuntimeConfigValue> {
		const entity = await this.em.findOneOrFail(RuntimeConfigEntity, { key });

		const runtimeConfigValue = this.mapToDo(entity);
		return runtimeConfigValue;
	}

	protected mapToDo(entity: RuntimeConfigEntity): RuntimeConfigValue {
		const typeAndValue = this.getTypeAndValue(entity);
		return new RuntimeConfigValue({
			id: entity.id,
			key: entity.key,
			...typeAndValue,
		});
	}

	private getTypeAndValue(entity: RuntimeConfigEntity): RuntimeConfigValueAndType {
		if (entity.type === 'string') {
			return { type: 'string', value: entity.value };
		}
		if (entity.type === 'number') {
			const value = Number(entity.value);
			if (isNaN(value)) {
				// TODO: Loggable
				throw new Error(`Value for key ${entity.key} is not a valid number`);
			}
			return { type: 'number', value: Number(entity.value) };
		}
		if (entity.type === 'boolean') {
			return { type: 'boolean', value: entity.value === 'true' };
		}
		// TODO: better error handling
		throw new Error(`Unsupported type`);
	}

	protected mapDOToEntityProperties(domainObject: RuntimeConfigValue): EntityData<RuntimeConfigEntity> {
		const props = domainObject.getProps();
		return {
			key: props.key,
			type: props.type,
			value: props.value.toString(),
		};
	}
}
