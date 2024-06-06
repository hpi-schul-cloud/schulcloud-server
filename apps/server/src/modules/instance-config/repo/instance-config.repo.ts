import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { InstanceConfig, InstanceConfigProps } from '../domain';
import { InstanceConfigEntity } from '../entity';

@Injectable()
export class InstanceConfigRepo extends BaseDomainObjectRepo<InstanceConfig, InstanceConfigEntity> {
	protected override get entityName(): EntityName<InstanceConfigEntity> {
		return InstanceConfigEntity;
	}

	protected override mapDOToEntityProperties(entityDO: InstanceConfig): EntityData<InstanceConfigEntity> {
		const entityProps: EntityData<InstanceConfigEntity> = {
			name: entityDO.name,
		};

		return entityProps;
	}

	protected mapEntityToDoProperties(entity: InstanceConfigEntity): InstanceConfigProps {
		const doProps: InstanceConfigProps = {
			id: entity.id,
			name: entity.name,
		};

		return doProps;
	}

	public async findById(id: EntityId): Promise<InstanceConfig> {
		const entity: InstanceConfigEntity = await super.findEntityById(id);

		const course: InstanceConfig = new InstanceConfig(this.mapEntityToDoProperties(entity));

		return course;
	}
}
