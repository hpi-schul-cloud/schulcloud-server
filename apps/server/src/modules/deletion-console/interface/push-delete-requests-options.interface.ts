export interface PushDeletionRequestsOptions {
	refsFilePath: string;
	targetRefDomain: string;
	deleteInMinutes: number;
	callsDelayMs: number;
}
