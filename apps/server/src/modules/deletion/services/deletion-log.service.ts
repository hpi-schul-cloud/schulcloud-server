import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionLogRepo } from '../repo';
import { DeletionLog } from '../domain/deletion-log.do';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionOperationModel } from '../domain/types/deletion-operation-model.enum';

@Injectable()
export class DeletionLogService {
	constructor(private readonly deletionLogRepo: DeletionLogRepo) {}

	async createDeletionLog(
		deletionRequestId: EntityId,
		domain: DeletionDomainModel,
		operation: DeletionOperationModel,
		modifiedCounter: number,
		deletedCounter: number
	): Promise<void> {
		const newDeletionLog = new DeletionLog({
			id: new ObjectId().toHexString(),
			domain,
			deletionRequestId,
			operation,
			modifiedCount: modifiedCounter,
			deletedCount: deletedCounter,
		});

		await this.deletionLogRepo.create(newDeletionLog);
	}

	async findByDeletionRequestId(deletionRequestId: EntityId): Promise<DeletionLog[]> {
		const deletionLogs: DeletionLog[] = await this.deletionLogRepo.findAllByDeletionRequestId(deletionRequestId);

		return deletionLogs;
	}
}
