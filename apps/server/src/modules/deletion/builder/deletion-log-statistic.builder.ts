import { DomainOperation } from '@shared/domain/interface';
import { DomainModel, EntityId, OperationModel } from '@shared/domain/types';

export class DeletionLogStatisticBuilder {
	static build(domain: DomainModel, operation: OperationModel, count: number, refs: EntityId[]): DomainOperation {
		const deletionLogStatistic = { domain, operation, count, refs };

		return deletionLogStatistic;
	}
}
