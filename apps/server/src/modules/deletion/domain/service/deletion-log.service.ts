import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { DomainDeletionReport } from '../interface';
import { DeletionLogRepo } from '../../repo';
import { DeletionLog } from '../do';

@Injectable()
export class DeletionLogService {
	constructor(private readonly deletionLogRepo: DeletionLogRepo) {}

	async createDeletionLog(deletionRequestId: EntityId, domainDeletionReport: DomainDeletionReport): Promise<void> {
		const newDeletionLog = new DeletionLog({
			id: new ObjectId().toHexString(),
			deletionRequestId,
			performedAt: new Date(),
			domain: domainDeletionReport.domain,
			operations: domainDeletionReport.operations,
			subdomainOperations: domainDeletionReport.subdomainOperations
				? domainDeletionReport.subdomainOperations
				: undefined,
		});

		await this.deletionLogRepo.create(newDeletionLog);
	}

	async findByDeletionRequestId(deletionRequestId: EntityId): Promise<DeletionLog[]> {
		const deletionLogs: DeletionLog[] = await this.deletionLogRepo.findAllByDeletionRequestId(deletionRequestId);

		return deletionLogs;
	}
}
