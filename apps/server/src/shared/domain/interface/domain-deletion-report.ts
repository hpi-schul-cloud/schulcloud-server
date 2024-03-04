import { DomainName } from '../types';
import { DomainOperationReport } from './domain-operation-report';

export interface DomainDeletionReport {
	domain: DomainName;
	domainOperationReport: DomainOperationReport[];
	subDomainReport?: DomainDeletionReport;
}
