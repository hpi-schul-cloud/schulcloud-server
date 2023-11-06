import { Injectable } from '@nestjs/common';
import { DeletionClient } from '../client';
import { QueueDeletionRequestInput, QueueDeletionRequestOutput } from './interface';

@Injectable()
export class BatchDeletionService {
	constructor(private readonly deletionClient: DeletionClient) {}

	async queueDeletionRequests(inputs: QueueDeletionRequestInput[]): Promise<QueueDeletionRequestOutput[]> {
		const outputs: QueueDeletionRequestOutput[] = [];

		// For every provided deletion request input, try to queue it via deletion client.
		// In any case, add the result of the trial to the outputs - it will be either a valid
		// response in a form of a requestId + deletionPlannedAt values pair or some error
		// returned from the client. In any case, every input should be processed.
		for (const input of inputs) {
			const deletionRequestInput = {
				targetRef: {
					domain: input.targetRefDomain,
					id: input.targetRefId,
				},
				deleteInMinutes: input.deleteInMinutes,
			};

			try {
				const deletionRequestOutput = await this.deletionClient.queueDeletionRequest(deletionRequestInput);

				// In case of a successful client response, add the
				// requestId + deletionPlannedAt values pair to the outputs.
				outputs.push({
					requestId: deletionRequestOutput.requestId,
					deletionPlannedAt: deletionRequestOutput.deletionPlannedAt,
				});
			} catch (err) {
				// In case of a failure client response, add the full error message to the outputs.
				outputs.push({ error: err.toString() });
			}
		}

		return outputs;
	}
}
