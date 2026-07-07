import { type DomainDeletionReport } from '../interface/domain-deletion-report';
import { type DomainOperationReport } from '../interface/domain-operation-report';
import { type DomainName } from '../types/domain-name.enum';

export class DomainDeletionReportBuilder {
	public static build(
		domain: DomainName,
		operations: DomainOperationReport[],
		subdomainOperations?: DomainDeletionReport[]
	): DomainDeletionReport {
		const domainDeletionReport = { domain, operations, subdomainOperations: subdomainOperations || null };

		return domainDeletionReport;
	}
}
