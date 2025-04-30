import { EntityId } from '@shared/domain/types';

export enum StepOperationType {
	DELETE = 'delete',
	UPDATE = 'update',
}

export type StepOperationReport = {
	operation: StepOperationType;
	count: number;
	refs: EntityId[];
};

export type StepReport = {
	operations: StepOperationReport[];
};
