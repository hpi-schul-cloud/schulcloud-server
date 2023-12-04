import { Injectable } from '@nestjs/common';
import { DeletionClient } from '@modules/deletion-console';

@Injectable()
export class DeletionExecutionUc {
	constructor(private readonly deletionClient: DeletionClient) {}

	async triggerDeletionExecution(limit?: number): Promise<void> {
		await this.deletionClient.executeDeletions(limit);
	}
}
