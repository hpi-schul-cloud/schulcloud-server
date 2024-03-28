import { OperationType } from '../types';

export interface DomainOperationReport {
	operation: OperationType;
	count: number;
	refs: string[];
}
