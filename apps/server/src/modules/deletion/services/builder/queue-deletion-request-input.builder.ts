import { QueueDeletionRequestInput } from '../interface';

export class QueueDeletionRequestInputBuilder {
	static build(targetRefDomain: string, targetRefId: string, deleteInMinutes: number): QueueDeletionRequestInput {
		return { targetRefDomain, targetRefId, deleteInMinutes };
	}
}
