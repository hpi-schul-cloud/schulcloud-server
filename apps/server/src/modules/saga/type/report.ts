import { EntityId } from '@shared/domain/types';
import { ModuleName } from './module-name';

export const StepOperationType = {
	DELETE: 'delete',
	UPDATE: 'update',
} as const;

export type StepOperationType = (typeof StepOperationType)[keyof typeof StepOperationType];

export type StepOperationReport = {
	operation: StepOperationType;
	count: number;
	refs: EntityId[];
};

export type StepReport = {
	moduleName: ModuleName;
	operations: StepOperationReport[];
};

// comes from '@modules/deletion' - StatusModel
// TODO: check if we need this
export const StepStatus = {
	FAILED: 'failed',
	FINISHED: 'finished',
	PENDING: 'pending',
	SUCCESS: 'success',
	REGISTERED: 'registered',
} as const;

export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];

// TODO: check if builder is needed
export class StepOperationReportBuilder {
	public static build(operation: StepOperationType, count: number, refs: EntityId[]): StepOperationReport {
		const stepOperationReport: StepOperationReport = { operation, count, refs };

		return stepOperationReport;
	}
}

// TODO: check if builder is needed
export class StepReportBuilder {
	public static build(moduleName: ModuleName, operations: StepOperationReport[]): StepReport {
		const stepReport: StepReport = { moduleName, operations };

		return stepReport;
	}
}
