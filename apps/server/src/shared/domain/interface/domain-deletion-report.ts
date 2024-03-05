import { DomainName } from '../types';
import { DomainOperationReport } from './domain-operation-report';

export interface DomainDeletionReport {
	domain: DomainName;
	operations: DomainOperationReport[];
	subdomainOperations?: DomainDeletionReport[] | null;
}
