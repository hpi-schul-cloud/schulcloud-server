import { Injectable } from '@nestjs/common';
import { DeletionClient } from '../deletion-client';

@Injectable()
export class DeletionExecutionUc {
	constructor(private readonly deletionClient: DeletionClient) {}

	async triggerDeletionExecution(limit?: number, runFailed?: boolean): Promise<void> {
		await this.deletionClient.executeDeletions(limit, runFailed);
	}
}
