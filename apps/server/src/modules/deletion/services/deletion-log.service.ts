import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { DomainDeletionReport } from '@shared/domain/interface';
import { DeletionLog } from '../domain/deletion-log.do';
import { DeletionLogRepo } from '../repo';

@Injectable()
export class DeletionLogService {
	constructor(private readonly deletionLogRepo: DeletionLogRepo) {}

	async createDeletionLog(deletionRequestId: EntityId, domainDeletionReport: DomainDeletionReport): Promise<void> {
		const newDeletionLog = new DeletionLog({
			id: new ObjectId().toHexString(),
			deletionRequestId,
			performedAt: new Date(),
			domain: domainDeletionReport.domain,
			domainOperationReport: domainDeletionReport.domainOperationReport,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			domainDeletionReport: domainDeletionReport.subDomainReport ? domainDeletionReport.subDomainReport : undefined,
		});

		await this.deletionLogRepo.create(newDeletionLog);
	}

	async findByDeletionRequestId(deletionRequestId: EntityId): Promise<DeletionLog[]> {
		const deletionLogs: DeletionLog[] = await this.deletionLogRepo.findAllByDeletionRequestId(deletionRequestId);

		return deletionLogs;
	}
}
