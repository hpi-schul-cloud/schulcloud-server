import { Injectable } from '@nestjs/common';
import { DeletionClient } from '../client';
import { DeletionExecutionTriggerResult } from './interface';
import { DeletionExecutionTriggerResultBuilder } from './builder';

@Injectable()
export class DeletionExecutionUc {
	constructor(private readonly deletionClient: DeletionClient) {}

	async triggerDeletionExecution(limit?: number): Promise<DeletionExecutionTriggerResult> {
		// Try to trigger the deletion execution(s) via Deletion API client,
		// return successful status in case of a success, otherwise return
		// a result with a failure status and a proper error message.
		try {
			await this.deletionClient.executeDeletions(limit);

			return DeletionExecutionTriggerResultBuilder.buildSuccess();
		} catch (err) {
			return DeletionExecutionTriggerResultBuilder.buildFailure(err as Error);
		}
	}
}
