import { Injectable } from '@nestjs/common';
import { EntityManager, MikroORM } from '@mikro-orm/core';

import { DeletionRequest } from '../do';
import { UserDeletionInjectionService } from './user-deletion-injection.service';

@Injectable()
export class DeletionExecutionService {
	constructor(
		private readonly orm: MikroORM,
		private readonly em: EntityManager,
		private readonly userDeletionInjectionService: UserDeletionInjectionService
	) {}

	// Transactional() - MikroORM 6
	public async executeDeletionRequest(deletionRequest: DeletionRequest): Promise<void> {
		const deletionServices = this.userDeletionInjectionService.getUserDeletionServices();

		const deletionPromises = deletionServices.map((service) => service.deleteUserData(deletionRequest.targetRefId));

		const results = await Promise.allSettled(deletionPromises);

		/*
		const em = this.orm.em.fork({ useContext: true });
		await em.begin();
		try {
			await deletionServices[0].deleteUserData(deletionRequest.targetRefId);
			await em.commit();
		} catch (error) {
			await em.rollback();
			throw error;
		}
		*/

		// await deletionServices[0].deleteUserData(deletionRequest.targetRefId);
		await this.em.flush();

		results.forEach((result) => {
			if (result.status === 'rejected') {
				console.error(result.reason);
			}
		});

		// await this.orm.em.transactional(async (em) => {
		// });
	}
}
