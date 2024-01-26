import { DomainModel, OperationType } from '../types';

export interface DomainOperation {
	domain: DomainModel;
	operation: OperationType;
	count: number;
	refs: string[];
}
