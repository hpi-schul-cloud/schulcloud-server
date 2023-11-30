import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { DeletionLog } from '../domain/deletion-log.do';
import { DeletionDomainModel, DeletionOperationModel } from '../domain/types';
import { DeletionLogRepo } from '../repo';

@Injectable()
export class DeletionLogService {
	constructor(private readonly deletionLogRepo: DeletionLogRepo) {}

	async createDeletionLog(
		deletionRequestId: EntityId,
		domain: DeletionDomainModel,
		operation: DeletionOperationModel,
		modifiedCount: number,
		deletedCount: number
	): Promise<void> {
		const newDeletionLog = new DeletionLog({
			id: new ObjectId().toHexString(),
			performedAt: new Date(),
			domain,
			deletionRequestId,
			operation,
			modifiedCount,
			deletedCount,
		});

		await this.deletionLogRepo.create(newDeletionLog);
	}

	async findByDeletionRequestId(deletionRequestId: EntityId): Promise<DeletionLog[]> {
		const deletionLogs: DeletionLog[] = await this.deletionLogRepo.findAllByDeletionRequestId(deletionRequestId);

		return deletionLogs;
	}
}
