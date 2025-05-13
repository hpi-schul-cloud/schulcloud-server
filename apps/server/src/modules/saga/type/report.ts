import { EntityId } from '@shared/domain/types';
import { ModuleName } from './saga-step';

export const enum StepOperationType {
	DELETE = 'delete',
	UPDATE = 'update',
}

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
export const enum StepStatus {
	FAILED = 'failed',
	FINISHED = 'finished',
	PENDING = 'pending',
	SUCCESS = 'success',
	REGISTERED = 'registered',
}
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
