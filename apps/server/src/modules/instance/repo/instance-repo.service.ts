import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { Instance, InstanceProps } from '../domain';
import { InstanceEntity } from '../entity';

@Injectable()
export class InstanceRepo extends BaseDomainObjectRepo<Instance, InstanceEntity> {
	protected override get entityName(): EntityName<InstanceEntity> {
		return InstanceEntity;
	}

	protected override mapDOToEntityProperties(entityDO: Instance): EntityData<InstanceEntity> {
		const entityProps: EntityData<InstanceEntity> = {
			name: entityDO.name,
		};

		return entityProps;
	}

	protected mapEntityToDoProperties(entity: InstanceEntity): InstanceProps {
		const doProps: InstanceProps = {
			id: entity.id,
			name: entity.name,
		};

		return doProps;
	}

	public async findById(id: EntityId): Promise<Instance> {
		const entity: InstanceEntity = await super.findEntityById(id);

		const course: Instance = new Instance(this.mapEntityToDoProperties(entity));

		return course;
	}

	public async getInstance(): Promise<Instance> {
		const entities: InstanceEntity[] = await this.em.find(this.entityName, {});

		if (entities.length !== 1) {
			// TODO
			throw new Error('Instance could not be identified');
		}

		const course: Instance = new Instance(this.mapEntityToDoProperties(entities[0]));

		return course;
	}
}
