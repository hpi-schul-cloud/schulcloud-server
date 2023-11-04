import { Injectable } from '@nestjs/common';
import { DeletionClient } from '@modules/deletion/client';

export interface QueueDeletionRequestInput {
	targetRefDomain: string;
	targetRefId: string;
	deleteInMinutes: number;
}

export interface QueueDeletionRequestOutput {
	requestId?: string;
	deletionPlannedAt?: Date;
	error?: string;
}

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
