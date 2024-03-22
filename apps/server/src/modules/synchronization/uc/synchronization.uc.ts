import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { SanisResponse, SchulconnexRestClient } from '@src/infra/schulconnex-client';
import { ConfigService } from '@nestjs/config';
import { SynchronizationService } from '../domain/service';
import { Synchronization } from '../domain';
import { SynchronizationStatusModel } from '../domain/types';
import { SynchronizationLoggable } from '../domain/loggable';
import { SynchronizationErrorLoggableException } from '../domain/loggable-exception';
import { SynchronizationConfig } from '../config';

@Injectable()
export class SynchronizationUc {
	constructor(
		private readonly configService: ConfigService<SynchronizationConfig, true>,
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

		try {
			const usersToCheck = await this.findUsersToSynchronize(systemId);
			const chunkSize = this.configService.get<number>('SYNCHRONIZATION_CHUNK');
			const chunks = this.chunkArray(usersToCheck, chunkSize);
			const promises = chunks.map((chunk) => this.updateLastSyncedAt(chunk, systemId));
			const results = await Promise.all(promises);
			const userSyncCount = results.reduce((acc, curr) => +acc + +curr, 0);

			await this.updateSynchronization(synchronizationId, SynchronizationStatusModel.SUCCESS, userSyncCount);
			this.logger.info(new SynchronizationLoggable('End synchronization users from systemId', systemId, userSyncCount));
		} catch (error) {
			let logMessage = '';
			if (error instanceof SynchronizationErrorLoggableException) {
				logMessage = error.getLogMessage()?.data?.errorMessage as string;
			} else {
				logMessage = `Synchronisation process failed for users provided by the system ${systemId}`;
			}
			await this.updateSynchronization(synchronizationId, SynchronizationStatusModel.FAILED, 0, logMessage);
			this.logger.info(new SynchronizationLoggable(logMessage, systemId));
		}
	}

	public async findUsersToSynchronize(systemId: string): Promise<string[]> {
		let usersToCheck: string[] = [];
		const usersDownloaded: SanisResponse[] = await this.schulconnexRestClient.getPersonenInfo({});

		if (usersDownloaded.length === 0) {
			throw new SynchronizationErrorLoggableException(`No users to check from system: ${systemId}`);
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
			throw new SynchronizationErrorLoggableException(
				`Failed to update lastSyncedAt field for users provisioned by system ${systemId}`
			);
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
