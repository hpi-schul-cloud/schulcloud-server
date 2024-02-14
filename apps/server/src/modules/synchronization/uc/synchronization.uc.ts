import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { SanisResponse, SchulconnexRestClient } from '@src/infra/schulconnex-client';
import { SynchronizationService } from '../service';

@Injectable()
export class SynchronizationUc {
	constructor(
		private readonly schulconnexRestClient: SchulconnexRestClient,
		private readonly synchronizationService: SynchronizationService,
		private readonly userService: UserService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(SynchronizationUc.name);
	}

	async findUsersToDelete(): Promise<void> {
		this.logger.debug({ action: 'findUsersToDelete' });

		const synchronizationId = await this.synchronizationService.createSynchronization();
		console.log(synchronizationId);

		const usersToCheck: SanisResponse[] = await this.schulconnexRestClient.getPersonenInfo({});

		console.log(usersToCheck);
	}
}
