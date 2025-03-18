import { Injectable } from '@nestjs/common';
import { EntityManager, MikroORM } from '@mikro-orm/core';

import { DeletionRequest } from '../do';
import { DeletionRequestService, DeletionLogService, UserDeletionInjectionService } from './';

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
		private readonly deletionRequestService: DeletionRequestService,
		private readonly deletionLogService: DeletionLogService
	) {}

	public async executeDeletionRequest(deletionRequest: DeletionRequest): Promise<void> {
		await this.deletionRequestService.markDeletionRequestAsPending(deletionRequest.id);

		const deletionServices = this.userDeletionInjectionService.getUserDeletionServices();

		const deletionPromises = deletionServices.map((service) => service.deleteUserData(deletionRequest.targetRefId));

		let failed = false;
		const results = await Promise.allSettled(deletionPromises);

		for (const result of results) {
			if (result.status === 'rejected') {
				failed = true;
			} else {
				const reports = Array.isArray(result.value) ? result.value : [result.value];
				for (const report of reports) {
					await this.deletionLogService.createDeletionLog(deletionRequest.id, report);
				}
			}
		}

		if (failed) {
			await this.deletionRequestService.markDeletionRequestAsFailed(deletionRequest.id);
		} else {
			await this.deletionRequestService.markDeletionRequestAsExecuted(deletionRequest.id);
		}
	}
}
