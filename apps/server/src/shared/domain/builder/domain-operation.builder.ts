import { DomainOperation } from '@shared/domain/interface';
import { DomainName, EntityId, OperationType } from '@shared/domain/types';

export class DomainOperationBuilder {
	static build(domain: DomainName, operation: OperationType, count: number, refs: EntityId[]): DomainOperation {
		const domainOperation = { domain, operation, count, refs };

		return domainOperation;
	}
}
