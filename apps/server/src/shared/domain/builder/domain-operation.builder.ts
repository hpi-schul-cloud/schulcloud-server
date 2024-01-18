import { DomainOperation } from '@shared/domain/interface';
import { DomainModel, EntityId, OperationModel } from '@shared/domain/types';

export class DomainOperationBuilder {
	static build(domain: DomainModel, operation: OperationModel, count: number, refs: EntityId[]): DomainOperation {
		const domainOperation = { domain, operation, count, refs };

		return domainOperation;
	}
}
