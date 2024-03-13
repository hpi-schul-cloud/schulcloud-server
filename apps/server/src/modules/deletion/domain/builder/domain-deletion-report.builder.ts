import { DomainDeletionReport } from '../interface/domain-deletion-report';
import { DomainOperationReport } from '../interface/domain-operation-report';
import { DomainName } from '../types/domain-name.enum';

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
