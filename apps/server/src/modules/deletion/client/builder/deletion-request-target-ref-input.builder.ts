import { DeletionRequestTargetRefInput } from '../interface';

export class DeletionRequestTargetRefInputBuilder {
	static build(domain: string, id: string): DeletionRequestTargetRefInput {
		return { domain, id };
	}
}
