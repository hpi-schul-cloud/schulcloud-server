import { DomainOperationReport, DomainDeletionReport } from '../interface';
import { DomainName } from '../types';

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
