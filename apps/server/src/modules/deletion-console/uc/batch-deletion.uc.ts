import { Injectable } from '@nestjs/common';
import { AccountService } from '@src/modules/account';
import { UserService } from '@src/modules/user';
import { BatchDeletionSummaryBuilder, BatchDeletionSummaryDetailBuilder } from '../builder';
import { BatchDeletionService, ReferencesService } from '../services';
import { QueueDeletionRequestInputBuilder } from '../services/builder';
import { QueueDeletionRequestInput } from '../services/interface';
import { BatchDeletionSummary, BatchDeletionSummaryOverallStatus } from './interface';

@Injectable()
export class BatchDeletionUc {
	constructor(
		private readonly batchDeletionService: BatchDeletionService,
		private readonly userService: UserService,
		private readonly accountService: AccountService
	) {}

	async deleteRefsFromTxtFile(
		refsFilePath: string,
		targetRefDomain = 'user',
		deleteInMinutes = 43200, // 43200 minutes = 720 hours = 30 days
		callsDelayMilliseconds?: number
	): Promise<BatchDeletionSummary> {
		// First, load all the references from the provided text file (with given path).
		const refsFromTxtFile = ReferencesService.loadFromTxtFile(refsFilePath);

		return this.buildInputsQueueDeletionRequestsAndReturnSummary(
			refsFromTxtFile,
			targetRefDomain,
			deleteInMinutes,
			callsDelayMilliseconds
		);
	}

	async deleteUnsynchronizedRefs(
		systemId: string,
		unsyncedForMinutes = 10080,
		targetRefDomain = 'user',
		deleteInMinutes = 43200, // 43200 minutes = 720 hours = 30 days
		callsDelayMilliseconds?: number
	): Promise<BatchDeletionSummary> {
		const unsynchronizedUserIds = await this.userService.findUnsynchronizedUserIds(unsyncedForMinutes);

		const accountIds = await this.accountService.findByUserIdsAndSystemId(unsynchronizedUserIds, systemId);

		return this.buildInputsQueueDeletionRequestsAndReturnSummary(
			accountIds,
			targetRefDomain,
			deleteInMinutes,
			callsDelayMilliseconds
		);
	}

	private async buildInputsQueueDeletionRequestsAndReturnSummary(
		refs: string[],
		targetRefDomain: string,
		deleteInMinutes: number,
		callsDelayMilliseconds?: number
	): Promise<BatchDeletionSummary> {
		const inputs: QueueDeletionRequestInput[] = [];

		// For each reference found in a given file, add it to the inputs
		// array (with added targetRefDomain and deleteInMinutes fields).
		refs.forEach((ref) => inputs.push(QueueDeletionRequestInputBuilder.build(targetRefDomain, ref, deleteInMinutes)));

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
