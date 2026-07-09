import { type DeletionRequestInput } from '../interface';
import { DeletionRequestTargetRefInputBuilder } from './deletion-request-target-ref-input.builder';

export class DeletionRequestInputBuilder {
	public static build(targetRefDomain: string, targetRefId: string, deleteInMinutes?: number): DeletionRequestInput {
		return {
			targetRef: DeletionRequestTargetRefInputBuilder.build(targetRefDomain, targetRefId),
			deleteInMinutes,
		};
	}
}
