import { EntityId } from '@shared/domain/types';
import { DomainOperationReport, DomainDeletionReport } from '../../../../domain/interface';
import { DomainName } from '../../../../domain/types';

export class DeletionLogStatisticBuilder {
	static build(
		domain: DomainName,
		operations: DomainOperationReport[],
		subdomainOperations?: DomainDeletionReport[] | null,
		deletionRequestId?: EntityId,
	): DomainDeletionReport {
		const deletionLogStatistic: DomainDeletionReport = {
			domain,
			operations,
			subdomainOperations: subdomainOperations || null,
			deletionRequestId,
		};

		return deletionLogStatistic;
	}
}
