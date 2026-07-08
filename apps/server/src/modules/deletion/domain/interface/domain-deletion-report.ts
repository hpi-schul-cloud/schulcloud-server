import { type DomainName } from '../types';
import { type DomainOperationReport } from './domain-operation-report';

export interface DomainDeletionReport {
	domain: DomainName;
	operations: DomainOperationReport[];
	subdomainOperations?: DomainDeletionReport[] | null;
}
