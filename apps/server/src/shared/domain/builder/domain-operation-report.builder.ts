import { DomainOperationReport } from '@shared/domain/interface';
import { EntityId, OperationType } from '@shared/domain/types';

export class DomainOperationReportBuilder {
	static build(operation: OperationType, count: number, refs: EntityId[]): DomainOperationReport {
		const domainOperationReport = { operation, count, refs };

		return domainOperationReport;
	}
}
