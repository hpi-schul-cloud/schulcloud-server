import { DomainOperation } from '@shared/domain/interface';
import { DomainName, EntityId, OperationType } from '@shared/domain/types';

export class DeletionLogStatisticBuilder {
	static build(domain: DomainName, operation: OperationType, count: number, refs: EntityId[]): DomainOperation {
		const deletionLogStatistic = { domain, operation, count, refs };

		return deletionLogStatistic;
	}
}
