import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { RuntimeConfigValue } from '../domain/runtime-config-value.do';
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
		return new RuntimeConfigValue({
			id: entity.id,
			key: entity.key,
		});
	}

	protected mapDOToEntityProperties(domainObject: RuntimeConfigValue): EntityData<RuntimeConfigEntity> {
		const props = domainObject.getProps();
		return {
			key: props.key,
		};
	}
}
