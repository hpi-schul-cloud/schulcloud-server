import { type PushDeletionRequestsOptions } from '../interface';

export class PushDeleteRequestsOptionsBuilder {
	public static build(
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
