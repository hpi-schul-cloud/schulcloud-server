export interface DeletionRequestTargetRefInput {
	domain: string;
	id: string;
}

export interface DeletionRequestInput {
	targetRef: DeletionRequestTargetRefInput;
	deleteInMinutes?: number;
}
