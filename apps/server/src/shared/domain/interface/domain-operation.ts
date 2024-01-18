import { DomainModel, EntityId, OperationModel } from '../types';

export interface DomainOperation {
	domain: DomainModel;
	operation: OperationModel;
	count: number;
	refs: EntityId[];
}
