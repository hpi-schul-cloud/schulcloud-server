import { Injectable } from '@nestjs/common';
import { EntityManager, MikroORM } from '@mikro-orm/core';

import { DeletionRequest } from '../do';
import { UserDeletionInjectionService } from './user-deletion-injection.service';

@Injectable()
export class DeletionExecutionSagaService {
	domainSteps = [
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
	];

	constructor(
		private readonly orm: MikroORM,
		private readonly em: EntityManager,
		private readonly userDeletionInjectionService: UserDeletionInjectionService
	) {}

	public async executeDeletionRequest(deletionRequest: DeletionRequest): Promise<void> {
		const deletionServices = this.userDeletionInjectionService.getUserDeletionServices();

		// TODO steps, handling of compensations and exceptions

		const deletionPromises = deletionServices.map((service) => service.deleteUserData(deletionRequest.targetRefId));

		const results = await Promise.allSettled(deletionPromises);

		results.forEach((result) => {
			if (result.status === 'rejected') {
				console.error(result.reason);
			}
		});
	}
}
