import { Injectable } from '@nestjs/common';
import { EntityManager, MikroORM } from '@mikro-orm/core';

import { DeletionRequest } from '../do';
import { DeletionRequestService, DeletionLogService, UserDeletionInjectionService } from './';
import { SagaService } from '@modules/saga';

/*
	'account',
	'board',
	'class',
	'courseGroup',
	'course',
	'dashboard',
	'file',
	'fileRecords',
	'lessons',
	'news',
	'pseudonyms',
	'rocketChatUser',
	'submissions',
	'task',
	'teams',
	'user',
 */

@Injectable()
export class DeletionExecutionService {
	constructor(
		private readonly orm: MikroORM,
		private readonly em: EntityManager,
		private readonly userDeletionInjectionService: UserDeletionInjectionService,
		private readonly sagaService: SagaService,
		private readonly deletionRequestService: DeletionRequestService,
		private readonly deletionLogService: DeletionLogService
	) {}

	public async executeDeletionRequest(deletionRequest: DeletionRequest): Promise<void> {
		await this.deletionRequestService.markDeletionRequestAsPending(deletionRequest.id);

		try {
			const reports = await this.sagaService.executeSaga('userDeletion', {
				userId: deletionRequest.targetRefId,
			});
			for (const report of reports) {
				// TODO refactor deletion log to be compatible with saga
				console.log('report', report);
				// await this.deletionLogService.createDeletionLog(deletionRequest.id, report);
			}
			await this.deletionRequestService.markDeletionRequestAsExecuted(deletionRequest.id);
		} catch (error) {
			await this.deletionRequestService.markDeletionRequestAsFailed(deletionRequest.id);
		}
	}
}
