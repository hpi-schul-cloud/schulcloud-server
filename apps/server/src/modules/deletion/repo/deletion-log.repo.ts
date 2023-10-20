import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { DeletionLog } from '../domain/deletion-log.do';
import { DeletionLogEntity } from '../entity/deletion-log.entity';
import { DeletionLogMapper } from './mapper/deletion-log.mapper';

@Injectable()
export class DeletionLogRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<DeletionLog> {
		const deletionRequest: DeletionLogEntity = await this.em.findOneOrFail(DeletionLogEntity, { id });

		const mapped: DeletionLog = DeletionLogMapper.mapToDO(deletionRequest);

		return mapped;
	}

	// create

	// update

	// delete
}
