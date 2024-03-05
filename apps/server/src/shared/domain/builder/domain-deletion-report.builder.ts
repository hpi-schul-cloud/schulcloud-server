import { DomainDeletionReport, DomainOperationReport } from '@shared/domain/interface';
import { DomainName } from '@shared/domain/types';

export class DomainDeletionReportBuilder {
	static build(
		domain: DomainName,
		operations: DomainOperationReport[],
		subdomainOperations?: DomainDeletionReport[]
	): DomainDeletionReport {
		const domainDeletionReport = { domain, operations, subdomainOperations: subdomainOperations || null };

		return domainDeletionReport;
	}
}
