import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { DomainDeletionReport } from '../interface';
import { DeletionLogRepo } from '../../repo';
import { DeletionLog } from '../do';

export type DeletionLogEntry = {
	deletionRequestId: EntityId;
	domainDeletionReport: DomainDeletionReport;
};

@Injectable()
export class DeletionLogService {
	constructor(private readonly deletionLogRepo: DeletionLogRepo) {}

	public async createDeletionLog(entry: DeletionLogEntry | DeletionLogEntry[]): Promise<void> {
		const entries = Array.isArray(entry) ? entry : [entry];

		const deletionLogs = entries.map((entry) => {
			const { deletionRequestId, domainDeletionReport } = entry;

			const deletionLog = new DeletionLog({
				id: new ObjectId().toHexString(),
				deletionRequestId,
				performedAt: new Date(),
				domain: domainDeletionReport.domain,
				operations: domainDeletionReport.operations,
				subdomainOperations: domainDeletionReport.subdomainOperations
					? domainDeletionReport.subdomainOperations
					: undefined,
			});
			return deletionLog;
		});

		await this.deletionLogRepo.create(deletionLogs);
	}

	public async findByDeletionRequestId(deletionRequestId: EntityId): Promise<DeletionLog[]> {
		const deletionLogs: DeletionLog[] = await this.deletionLogRepo.findAllByDeletionRequestId(deletionRequestId);

		return deletionLogs;
	}
}
