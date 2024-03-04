import { DomainDeletionReport, DomainOperationReport } from '@shared/domain/interface';
import { DomainName } from '@shared/domain/types';

export class DeletionLogStatisticBuilder {
	static build(
		domain: DomainName,
		domainOperationReport: DomainOperationReport[],
		subDomainReport: DomainDeletionReport
	): DomainDeletionReport {
		const deletionLogStatistic: DomainDeletionReport = { domain, domainOperationReport, subDomainReport };

		return deletionLogStatistic;
	}
}
