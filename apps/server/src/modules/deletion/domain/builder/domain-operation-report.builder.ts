import { EntityId } from '@shared/domain/types';
import { OperationType } from '../types/operation-type.enum';
import { DomainOperationReport } from '../interface/domain-operation-report';

export class DomainOperationReportBuilder {
	static build(operation: OperationType, count: number, refs: EntityId[]): DomainOperationReport {
		const domainOperationReport = { operation, count, refs };

		return domainOperationReport;
	}
}
