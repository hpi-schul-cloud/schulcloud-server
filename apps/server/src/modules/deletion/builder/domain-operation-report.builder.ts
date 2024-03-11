import { EntityId } from '@shared/domain/types';
import { OperationType } from '../types';
import { DomainOperationReport } from '../interface';

export class DomainOperationReportBuilder {
	static build(operation: OperationType, count: number, refs: EntityId[]): DomainOperationReport {
		const domainOperationReport = { operation, count, refs };

		return domainOperationReport;
	}
}
