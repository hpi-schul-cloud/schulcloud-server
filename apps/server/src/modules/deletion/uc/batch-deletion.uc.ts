import { Injectable } from '@nestjs/common';
import { BatchDeletionSummaryBuilder, BatchDeletionSummaryDetailBuilder } from '../builder';
import {
	ReferencesService,
	BatchDeletionService,
	QueueDeletionRequestInput,
	QueueDeletionRequestInputBuilder,
} from '../services';
import { BatchDeletionSummary, BatchDeletionSummaryOverallStatus } from '../interface';

@Injectable()
export class BatchDeletionUc {
	constructor(private readonly batchDeletionService: BatchDeletionService) {}

	async deleteRefsFromTxtFile(
		refsFilePath: string,
		targetRefDomain = 'user',
		deleteInMinutes = 43200, // 43200 minutes = 720 hours = 30 days
		callsDelayMilliseconds?: number
	): Promise<BatchDeletionSummary> {
		// First, load all the references from the provided text file (with given path).
		const refsFromTxtFile = ReferencesService.loadFromTxtFile(refsFilePath);

		const inputs: QueueDeletionRequestInput[] = [];

		// For each reference found in a given file, add it to the inputs
		// array (with added targetRefDomain and deleteInMinutes fields).
		refsFromTxtFile.forEach((ref) =>
			inputs.push(QueueDeletionRequestInputBuilder.build(targetRefDomain, ref, deleteInMinutes))
		);

		// Measure the overall queueing execution time by setting the start...
		const startTime = performance.now();

		const outputs = await this.batchDeletionService.queueDeletionRequests(inputs, callsDelayMilliseconds);

		// ...and end timestamps before and after the batch deletion service method execution.
		const endTime = performance.now();

		// Throw an error if the returned outputs number doesn't match the returned inputs number.
		if (outputs.length !== inputs.length) {
			throw new Error(
				'invalid result from the batch deletion service - expected to ' +
					'receive the same amount of outputs as the provided inputs, ' +
					`instead received ${outputs.length} outputs for ${inputs.length} inputs`
			);
		}

		const summary: BatchDeletionSummary = BatchDeletionSummaryBuilder.build(endTime - startTime);

		// Go through every received output and, in case of an error presence increase
		// a failure count or, in case of no error, increase a success count.
		for (let i = 0; i < outputs.length; i += 1) {
			if (outputs[i].error) {
				summary.failureCount += 1;
			} else {
				summary.successCount += 1;
			}

			// Also add all the processed inputs and outputs details to the overall summary.
			summary.details.push(BatchDeletionSummaryDetailBuilder.build(inputs[i], outputs[i]));
		}

		// If no failure has been spotted, assume an overall success.
		if (summary.failureCount === 0) {
			summary.overallStatus = BatchDeletionSummaryOverallStatus.SUCCESS;
		}

		return summary;
	}
}
