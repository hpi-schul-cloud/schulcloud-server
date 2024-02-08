import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { SanisResponse, SchulconnexRestClient } from '@src/infra/schulconnex-client';

@Injectable()
export class DeletionReconciliationUc {
	constructor(
		private readonly schulconnexRestClient: SchulconnexRestClient,
		private readonly userService: UserService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(DeletionReconciliationUc.name);
	}

	async findUsersToDelete(): Promise<void> {
		this.logger.debug({ action: 'findUsersToDelete' });

		const usersToCheck: SanisResponse[] = await this.schulconnexRestClient.getPersonenInfo({});

		console.log(usersToCheck);
	}
}
