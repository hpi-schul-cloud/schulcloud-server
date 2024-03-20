import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { SanisResponse, SchulconnexRestClient } from '@src/infra/schulconnex-client';
import { SynchronizationService } from '../domain/service';
import { Synchronization } from '../domain';
import { SynchronizationStatusModel } from '../domain/types';

@Injectable()
export class SynchronizationUc {
	constructor(
		private readonly schulconnexRestClient: SchulconnexRestClient,
		private readonly synchronizationService: SynchronizationService,
		private readonly userService: UserService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(SynchronizationUc.name);
		// this.config = 10000;
	}

	public async updateSystemUsersLastSyncedAt(systemId: string): Promise<void> {
		this.logger.debug({ action: 'updateSystemUsersLastSyncedAt', systemId });

		const synchronizationId = await this.synchronizationService.createSynchronization();

		const usersToCheck = await this.findUsersToSynchronize();
		if (usersToCheck instanceof Error) {
			// TODO
		} else {
			// usersToCheck podzilić na mniejsze paczki po 10k i po paczce uruchamiamy metody 
			// this.userService.findByExternalIdsAndProvidedBySystemId
			// await this.userService.updateLastSyncedAt(usersToSync);
			const usersToSync = await this.userService.findByExternalIdsAndProvidedBySystemId(usersToCheck, systemId);

			await this.userService.updateLastSyncedAt(usersToSync);

			const synchronizationToUpdate = await this.synchronizationService.findById(synchronizationId);

			await this.synchronizationService.update({
				...synchronizationToUpdate,
				count: usersToSync.length,
				status: SynchronizationStatusModel.SUCCESS,
			} as Synchronization);
		}
	}

	private async findUsersToSynchronize(): Promise<string[]> {
		let usersToCheck: string[] = [];
		try {
			const usersDownloaded: SanisResponse[] = await this.schulconnexRestClient.getPersonenInfo({});

			if (usersDownloaded.length === 0) {
				throw new Error('No users to check');
			}
			usersToCheck = usersDownloaded.map((user) => user.pid);
		} catch (error) {
			this.logger.warn(error);
		}

		return usersToCheck;
	}
}
