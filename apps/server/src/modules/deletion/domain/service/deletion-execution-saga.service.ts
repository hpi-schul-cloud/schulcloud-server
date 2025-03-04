import { Injectable } from '@nestjs/common';
import { EntityManager, MikroORM } from '@mikro-orm/core';

import { DeletionRequest } from '../do';
import { UserDeletionInjectionService } from './user-deletion-injection.service';
import { DomainName } from '../types';

@Injectable()
export class DeletionExecutionSagaService {
	domainOrder = [
		DomainName.NEWS,
		DomainName.CLASS,
		DomainName.COURSEGROUP,
		DomainName.LESSONS,
		DomainName.TASK,
		DomainName.COURSE,
		DomainName.TEAMS,
		DomainName.PSEUDONYMS,
		DomainName.SUBMISSIONS,
		DomainName.DASHBOARD,
		DomainName.BOARD,
		DomainName.FILE,
		DomainName.FILERECORDS,
		DomainName.ROCKETCHATUSER,
		DomainName.ACCOUNT,
		DomainName.USER,
	];

	constructor(
		private readonly orm: MikroORM,
		private readonly em: EntityManager,
		private readonly userDeletionInjectionService: UserDeletionInjectionService
	) {
		// this.domainOrder = Object.values(DomainName);
	}

	public async executeDeletionRequest(deletionRequest: DeletionRequest): Promise<void> {
		const deletionServices = this.userDeletionInjectionService.getUserDeletionServices();

		const orderMap = new Map(this.domainOrder.map((domain, index) => [domain, index]));
		deletionServices.sort((a, b) => {
			const domainA = a.getDomainName();
			const domainB = b.getDomainName();
			return (orderMap.get(domainA) ?? -1) - (orderMap.get(domainB) ?? -1);
		});

		// TODO steps, handling of compensations and exceptions

		const deletionPromises = deletionServices.map((service) => service.invokeUserDeletion(deletionRequest.targetRefId));

		const results = await Promise.allSettled(deletionPromises);

		results.forEach((result) => {
			if (result.status === 'rejected') {
				console.error(result.reason);
			}
		});
	}
}
