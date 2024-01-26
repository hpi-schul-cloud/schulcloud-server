import { DomainOperation } from '@shared/domain/interface';
import { DomainModel, EntityId, OperationType } from '@shared/domain/types';

export class DomainOperationBuilder {
	static build(domain: DomainModel, operation: OperationType, count: number, refs: EntityId[]): DomainOperation {
		const domainOperation = { domain, operation, count, refs };

		return domainOperation;
	}
}
