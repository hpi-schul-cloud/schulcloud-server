import { type EntityId } from '@shared/domain/types';
import { type OperationType } from '../types/operation-type.enum';
import { type DomainOperationReport } from '../interface/domain-operation-report';

export class DomainOperationReportBuilder {
	public static build(operation: OperationType, count: number, refs: EntityId[]): DomainOperationReport {
		const domainOperationReport = { operation, count, refs };

		return domainOperationReport;
	}
}
