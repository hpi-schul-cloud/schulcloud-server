import { EntityId } from '@shared/domain/types';
import { DomainDeletionReport } from '../interface/domain-deletion-report';
import { DomainOperationReport } from '../interface/domain-operation-report';
import { DomainName } from '../types/domain-name.enum';

export class DomainDeletionReportBuilder {
	static build(
		domain: DomainName,
		operations: DomainOperationReport[],
		subdomainOperations?: DomainDeletionReport[],
		deletionRequestId?: EntityId
	): DomainDeletionReport {
		const domainDeletionReport = {
			domain,
			operations,
			subdomainOperations: subdomainOperations || null,
			deletionRequestId,
		};

		return domainDeletionReport;
	}
}
