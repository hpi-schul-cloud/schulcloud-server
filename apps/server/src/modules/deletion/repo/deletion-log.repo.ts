import { EntityManager } from '@mikro-orm/mongodb';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { DeletionLog } from '../domain/do';
import { DeletionLogEntity } from './entity';
import { DeletionLogMapper } from './mapper';
import { EntityName, Utils } from '@mikro-orm/core';

@Injectable()
export class DeletionLogRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName(): EntityName<DeletionLogEntity> {
		return DeletionLogEntity;
	}

	public async findById(deletionLogId: EntityId): Promise<DeletionLog> {
		const deletionLog: DeletionLogEntity = await this.em.findOneOrFail(DeletionLogEntity, {
			id: deletionLogId,
		});

		const mapped: DeletionLog = DeletionLogMapper.mapToDO(deletionLog);

		return mapped;
	}

	public async findAllByDeletionRequestId(deletionRequestId: EntityId): Promise<DeletionLog[]> {
		const deletionLogEntities: DeletionLogEntity[] = await this.em.find(DeletionLogEntity, {
			deletionRequestId: new ObjectId(deletionRequestId),
		});

		const mapped: DeletionLog[] = DeletionLogMapper.mapToDOs(deletionLogEntities);

		return mapped;
	}

	public async create(deletionLog: DeletionLog | DeletionLog[]): Promise<void> {
		const deletionLogs = Utils.asArray(deletionLog);

		deletionLogs.forEach((domainObject) => {
			const deletionLogEntity: DeletionLogEntity = DeletionLogMapper.mapToEntity(domainObject);
			this.em.persist(deletionLogEntity);
		});

		await this.em.flush();
	}
}
