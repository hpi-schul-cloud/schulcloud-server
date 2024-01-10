import { DomainModel } from '../types';

export interface DomainOperation {
	domain: DomainModel;
	modifiedCount: number;
	deletedCount: number;
	modifiedRef?: string[];
	deletedRef?: string[];
}
