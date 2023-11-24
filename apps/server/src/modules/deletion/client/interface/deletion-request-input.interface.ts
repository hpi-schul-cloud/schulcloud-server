import { DeletionRequestTargetRefInput } from './deletion-request-target-ref-input.interface';

export interface DeletionRequestInput {
	targetRef: DeletionRequestTargetRefInput;
	deleteInMinutes?: number;
}
