import { Injectable } from '@nestjs/common';
import { DeletionClient } from '../client';
import { QueueDeletionRequestInput, QueueDeletionRequestOutput } from './interface';

@Injectable()
export class BatchDeletionService {
	constructor(private readonly deletionClient: DeletionClient) {}

	queueDeletionRequests(inputs: QueueDeletionRequestInput[]): QueueDeletionRequestOutput[] {
		const outputs: QueueDeletionRequestOutput[] = [];

		inputs.forEach(async (input) => {
			const deletionRequestInput = {
				targetRef: {
					domain: input.targetRefDomain,
					id: input.targetRefId,
				},
				deleteInMinutes: input.deleteInMinutes,
			};

			try {
				const deletionRequestOutput = await this.deletionClient.queueDeletionRequest(deletionRequestInput);

				outputs.push({
					requestId: deletionRequestOutput.requestId,
					deletionPlannedAt: deletionRequestOutput.deletionPlannedAt,
				});
			} catch (err) {
				outputs.push({ error: err });
			}
		});

		return outputs;
	}
}
