import { DomainOperation } from '@shared/domain/interface';
import { DomainModel } from '@shared/domain/types';

export class DomainOperationBuilder {
	static build(
		domain: DomainModel,
		modifiedCount: number,
		deletedCount: number,
		modifiedRef?: string[],
		deletedRef?: string[]
	): DomainOperation {
		const domainOperation = { domain, modifiedCount, deletedCount, modifiedRef, deletedRef };

		return domainOperation;
	}
}
