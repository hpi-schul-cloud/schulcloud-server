import { PushDeletionRequestsOptions } from '../interface';

export class PushDeleteRequestsOptionsBuilder {
	static build(
		refsFilePath: string,
		targetRefDomain: string,
		deleteInMinutes: number,
		callsDelayMs: number
	): PushDeletionRequestsOptions {
		return {
			refsFilePath,
			targetRefDomain,
			deleteInMinutes,
			callsDelayMs,
		};
	}
}
