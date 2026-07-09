import { type DeletionRequestTargetRefInput } from '../interface';

export class DeletionRequestTargetRefInputBuilder {
	public static build(domain: string, id: string): DeletionRequestTargetRefInput {
		return { domain, id };
	}
}
