import { DomainModel, OperationModel } from '../types';

export interface DomainOperation {
	domain: DomainModel;
	operation: OperationModel;
	count: number;
	refs: string[];
}
