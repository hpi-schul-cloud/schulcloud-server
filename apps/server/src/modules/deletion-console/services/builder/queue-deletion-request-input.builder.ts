import { type QueueDeletionRequestInput } from '../interface';

export class QueueDeletionRequestInputBuilder {
	public static build(
		targetRefDomain: string,
		targetRefId: string,
		deleteInMinutes: number
	): QueueDeletionRequestInput {
		return { targetRefDomain, targetRefId, deleteInMinutes };
	}
}
