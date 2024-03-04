import { DomainDeletionReport, DomainOperationReport } from '@shared/domain/interface';
import { DomainName } from '@shared/domain/types';

export class DomainDeletionReportBuilder {
	static build(domain: DomainName, domainOperationReport: DomainOperationReport[]): DomainDeletionReport {
		const domainDeletionReport = { domain, domainOperationReport };

		return domainDeletionReport;
	}
}
