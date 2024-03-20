import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Synchronization } from '../domain';
import { SynchronizationEntity } from '../entity';
import { SynchronizationMapper } from './mapper';

@Injectable()
export class SynchronizationRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName() {
		return SynchronizationEntity;
	}

	async findById(id: EntityId): Promise<Synchronization> {
		const synchronizations: SynchronizationEntity = await this.em.findOneOrFail(SynchronizationEntity, {
			id,
		});

		const mapped: Synchronization = SynchronizationMapper.mapToDO(synchronizations);

		return mapped;
	}

	async create(synchronizations: Synchronization): Promise<void> {
		const synchronizationsEntity: SynchronizationEntity = SynchronizationMapper.mapToEntity(synchronizations);
		this.em.persist(synchronizationsEntity);
		await this.em.flush();
	}

	async update(synchronization: Synchronization): Promise<void> {
		const synchronizationEntity = SynchronizationMapper.mapToEntity(synchronization);
		const referencedEntity = this.em.getReference(SynchronizationEntity, synchronizationEntity.id);

		await this.em.persistAndFlush(referencedEntity);
	}
}
