import { Injectable } from '@nestjs/common';
import { DeletionClient } from '../deletion-client';

@Injectable()
export class DeletionExecutionUc {
	constructor(private readonly deletionClient: DeletionClient) {}

	async triggerDeletionExecution(limit?: number): Promise<void> {
		await this.deletionClient.executeDeletions(limit);
	}
}
