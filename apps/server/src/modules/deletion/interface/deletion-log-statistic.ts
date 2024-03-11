import { DomainName } from '../types';

export interface DeletionLogStatistic {
	domain: DomainName;
	modifiedCount?: number;
	deletedCount?: number;
}
