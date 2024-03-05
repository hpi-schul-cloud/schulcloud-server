import { DomainDeletionReport, DomainOperationReport } from '@shared/domain/interface';
import { DomainName } from '@shared/domain/types';

export class DeletionLogStatisticBuilder {
	static build(
		domain: DomainName,
		operations: DomainOperationReport[],
		subdomainOperations?: DomainDeletionReport[] | null
	): DomainDeletionReport {
		const deletionLogStatistic: DomainDeletionReport = {
			domain,
			operations,
			subdomainOperations: subdomainOperations || null,
		};

		return deletionLogStatistic;
	}
}
