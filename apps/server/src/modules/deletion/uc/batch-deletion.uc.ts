import { Injectable } from '@nestjs/common';
import { ReferencesService, BatchDeletionService, QueueDeletionRequestInput } from '../services';
import { BatchDeletionSummary } from './interface';

@Injectable()
export class BatchDeletionUc {
	constructor(
		private readonly referencesService: ReferencesService,
		private readonly batchDeletionService: BatchDeletionService
	) {}

	deleteRefsFromTxtFile(filePath: string): BatchDeletionSummary {
		const refsFromTxtFile = ReferencesService.loadFromTxtFile(filePath);

		const inputs: QueueDeletionRequestInput[] = [];

		refsFromTxtFile.forEach((ref) =>
			inputs.push({
				targetRefDomain: 'user',
				targetRefId: ref,
				deleteInMinutes: 60,
			})
		);

		const outputs = this.batchDeletionService.queueDeletionRequests(inputs);

		const summary: BatchDeletionSummary = {
			successCount: 0,
			failureCount: 0,
			details: outputs,
		};

		outputs.forEach((output) => {
			if (output.error !== undefined) {
				summary.failureCount += 1;
			} else {
				summary.successCount += 1;
			}
		});

		return summary;
	}
}
