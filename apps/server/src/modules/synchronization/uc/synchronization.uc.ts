import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { SanisResponse, SchulconnexRestClient } from '@src/infra/schulconnex-client';
import { SynchronizationService } from '../domain/service';
import { Synchronization } from '../domain';
import { SynchronizationStatusModel } from '../domain/types';
import { SynchronizationLoggable } from '../domain/loggable';
import { SynchronizationErrorLoggableException } from '../domain/loggable-exception';

@Injectable()
export class SynchronizationUc {
	constructor(
		private readonly schulconnexRestClient: SchulconnexRestClient,
		private readonly synchronizationService: SynchronizationService,
		private readonly userService: UserService,
		private readonly logger: Logger
	) {
		this.logger.setContext(SynchronizationUc.name);
	}

	public async updateSystemUsersLastSyncedAt(systemId: string): Promise<void> {
		this.logger.info(new SynchronizationLoggable('Start synchronization users from systemId', systemId));

		const synchronizationId = await this.synchronizationService.createSynchronization();

		const usersToCheck = await this.findUsersToSynchronize(systemId);
		if (usersToCheck instanceof SynchronizationErrorLoggableException) {
			const logMessage = usersToCheck.getLogMessage();

			await this.updateSynchronization(
				synchronizationId,
				SynchronizationStatusModel.FAILED,
				0,
				logMessage?.data?.errorMessage as string
			);
			this.logger.info(new SynchronizationLoggable('Failed synchronization users from systemId', systemId));
		} else {
			const chunks = this.chunkArray(usersToCheck, 10000);
			let userSyncCount = 0;
			for (const chunk of chunks) {
				userSyncCount += await this.updateLastSyncedAt(chunk, systemId);
			}

			await this.updateSynchronization(synchronizationId, SynchronizationStatusModel.SUCCESS, userSyncCount);
			this.logger.info(new SynchronizationLoggable('End synchronization users from systemId', systemId, userSyncCount));
		}
	}

	public async findUsersToSynchronize(systemId: string): Promise<string[]> {
		let usersToCheck: string[] = [];
		const usersDownloaded: SanisResponse[] = await this.schulconnexRestClient.getPersonenInfo({});

		if (usersDownloaded.length === 0) {
			throw new SynchronizationErrorLoggableException(`No users to check from systemId: ${systemId}`);
		}
		usersToCheck = usersDownloaded.map((user) => user.pid);

		return usersToCheck;
	}

	public async updateLastSyncedAt(usersToCheck: string[], systemId: string): Promise<number> {
		try {
			const usersToSync = await this.userService.findByExternalIdsAndProvidedBySystemId(usersToCheck, systemId);

			await this.userService.updateLastSyncedAt(usersToSync);

			return usersToSync.length;
		} catch {
			throw new SynchronizationErrorLoggableException(`Problems with synchronization for systemId: ${systemId}`);
		}
	}

	public async updateSynchronization(
		synchronizationId: string,
		status: SynchronizationStatusModel,
		userSyncCount: number,
		failureCause?: string
	): Promise<void> {
		const synchronizationToUpdate = await this.synchronizationService.findById(synchronizationId);

		await this.synchronizationService.update({
			...synchronizationToUpdate,
			count: userSyncCount,
			status,
			failureCause,
		} as Synchronization);
	}

	chunkArray(array: string[], chunkSize: number): string[][] {
		const chunkedArray: string[][] = [];
		let index = 0;

		while (index < array.length) {
			chunkedArray.push(array.slice(index, index + chunkSize));
			index += chunkSize;
		}

		return chunkedArray;
	}
}
