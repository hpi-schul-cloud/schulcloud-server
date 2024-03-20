import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { SanisResponse, SchulconnexRestClient } from '@src/infra/schulconnex-client';
import { StatusModel } from '@src/modules/deletion';
import { SynchronizationService } from '../service';
import { Synchronization } from '../domain';

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

	async updateSystemUsersLastSyncedAt(systemId: string): Promise<void> {
		this.logger.debug({ action: 'updateSystemUsersLastSyncedAt', systemId });

		const synchronizationId = await this.synchronizationService.createSynchronization();

		const usersDownloaded: SanisResponse[] = await this.schulconnexRestClient.getPersonenInfo({});

		const userToCheck = usersDownloaded.map((user) => user.pid);

		const usersToSync = await this.userService.findByExternalIdsAndProvidedBySystemId(userToCheck, systemId);

		await this.userService.updateLastSyncedAt(usersToSync);

		const synchronizationToUpdate = await this.synchronizationService.findById(synchronizationId);

		await this.synchronizationService.update({
			...synchronizationToUpdate,
			count: usersToSync.length,
			status: StatusModel.SUCCESS,
		} as Synchronization);
	}
}
