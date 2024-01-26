import { DomainName, OperationType } from '../types';

export interface DomainOperation {
	domain: DomainName;
	operation: OperationType;
	count: number;
	refs: string[];
}
