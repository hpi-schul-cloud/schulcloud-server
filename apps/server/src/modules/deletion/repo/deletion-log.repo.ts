import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { DeletionLog } from '../domain';
import { DeletionLogEntity } from '../entity';
import { DeletionLogMapper } from './mapper';

@Injectable()
export class DeletionLogRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName() {
		return DeletionLogEntity;
	}

	async findById(deletionLogId: EntityId): Promise<DeletionLog> {
		const deletionLog: DeletionLogEntity = await this.em.findOneOrFail(DeletionLogEntity, {
			id: deletionLogId,
		});

		const mapped: DeletionLog = DeletionLogMapper.mapToDO(deletionLog);

		return mapped;
	}

	async findAllByDeletionRequestId(deletionRequestId: EntityId): Promise<DeletionLog[]> {
		const deletionLogEntities: DeletionLogEntity[] = await this.em.find(DeletionLogEntity, {
			deletionRequestId: new ObjectId(deletionRequestId),
		});

		const mapped: DeletionLog[] = DeletionLogMapper.mapToDOs(deletionLogEntities);

		return mapped;
	}

	async create(deletionLog: DeletionLog): Promise<void> {
		const deletionLogEntity: DeletionLogEntity = DeletionLogMapper.mapToEntity(deletionLog);
		this.em.persist(deletionLogEntity);
		await this.em.flush();
	}
}
