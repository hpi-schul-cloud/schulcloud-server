import { DomainOperationReport, DomainDeletionReport } from '../interface';
import { DomainName } from '../types';

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
