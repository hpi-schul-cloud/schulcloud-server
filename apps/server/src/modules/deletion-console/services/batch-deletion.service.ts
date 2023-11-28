import { Injectable } from '@nestjs/common';
import { QueueDeletionRequestOutputBuilder } from './builder';
import { DeletionClient, DeletionRequestInputBuilder } from '../deletion-client';
import { QueueDeletionRequestInput, QueueDeletionRequestOutput } from './interface';

@Injectable()
export class BatchDeletionService {
	constructor(private readonly deletionClient: DeletionClient) {}

	async queueDeletionRequests(
		inputs: QueueDeletionRequestInput[],
		callsDelayMilliseconds?: number
	): Promise<QueueDeletionRequestOutput[]> {
		const outputs: QueueDeletionRequestOutput[] = [];

		// For every provided deletion request input, try to queue it via deletion client.
		// In any case, add the result of the trial to the outputs - it will be either a valid
		// response in a form of a requestId + deletionPlannedAt values pair or some error
		// returned from the client. In any case, every input should be processed.
		for (const input of inputs) {
			const deletionRequestInput = DeletionRequestInputBuilder.build(
				input.targetRefDomain,
				input.targetRefId,
				input.deleteInMinutes
			);

			try {
				// eslint-disable-next-line no-await-in-loop
				const deletionRequestOutput = await this.deletionClient.queueDeletionRequest(deletionRequestInput);

				// In case of a successful client response, add the
				// requestId + deletionPlannedAt values pair to the outputs.
				outputs.push(
					QueueDeletionRequestOutputBuilder.buildSuccess(
						deletionRequestOutput.requestId,
						deletionRequestOutput.deletionPlannedAt
					)
				);
			} catch (err) {
				// In case of a failure client response, add the full error message to the outputs.
				outputs.push(QueueDeletionRequestOutputBuilder.buildError(err as Error));
			}

			// If any delay between the client calls has been requested, "sleep" for the specified amount of time.
			if (callsDelayMilliseconds && callsDelayMilliseconds > 0) {
				// eslint-disable-next-line no-await-in-loop
				await new Promise((resolve) => {
					setTimeout(resolve, callsDelayMilliseconds);
				});
			}
		}

		return outputs;
	}
}
