import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { SanisResponse, SchulconnexRestClient } from '@src/infra/schulconnex-client';
import { ConfigService } from '@nestjs/config';
import { ErrorLogMessage } from '@src/core/logger/types';
import { SynchronizationService } from '../domain/service';
import { Synchronization } from '../domain';
import { SynchronizationStatusModel } from '../domain/types';
import { StartSynchronizationLoggable, SucessSynchronizationLoggable } from '../domain/loggable';
import {
	FailedUpdateLastSyncedAtLoggableException,
	NoUsersToSynchronizationLoggableException,
	SynchronizationUnknownErrorLoggableException,
} from '../domain/loggable-exception';
import { SynchronizationConfig } from '../synchronization.config';

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
		this.logger.info(new StartSynchronizationLoggable(systemId));

		const synchronizationId = await this.synchronizationService.createSynchronization(systemId);

		try {
			const usersToCheck = await this.findUsersToSynchronize(systemId);
			const chunkSize = this.configService.get<number>('SYNCHRONIZATION_CHUNK');
			const chunks = this.chunkArray(usersToCheck, chunkSize);
			const promises = chunks.map((chunk) => this.updateLastSyncedAt(chunk, systemId));
			const results = await Promise.all(promises);
			const userSyncCount = results.reduce((acc, curr) => +acc + +curr, 0);

			await this.updateSynchronization(synchronizationId, SynchronizationStatusModel.SUCCESS, userSyncCount);
			this.logger.info(new SucessSynchronizationLoggable(systemId, userSyncCount));
		} catch (error) {
			const loggable =
				error instanceof NoUsersToSynchronizationLoggableException ||
				error instanceof FailedUpdateLastSyncedAtLoggableException
					? error
					: new SynchronizationUnknownErrorLoggableException(systemId);

			await this.updateSynchronization(
				synchronizationId,
				SynchronizationStatusModel.FAILED,
				0,
				loggable.getLogMessage()
			);
		}
	}

	public async findUsersToSynchronize(systemId: string): Promise<string[]> {
		let usersToCheck: string[] = [];
		const usersDownloaded: SanisResponse[] = await this.schulconnexRestClient.getPersonenInfo({});

		if (usersDownloaded.length === 0) {
			throw new NoUsersToSynchronizationLoggableException(systemId);
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
			throw new FailedUpdateLastSyncedAtLoggableException(systemId);
		}
	}

	public async updateSynchronization(
		synchronizationId: string,
		status: SynchronizationStatusModel,
		userSyncCount: number,
		error?: ErrorLogMessage
	): Promise<void> {
		const newSynchronization = new Synchronization({
			id: synchronizationId,
			status,
			count: userSyncCount,
			failureCause: error ? `${error?.data?.errorMessage as string}: ${error?.data?.systemId as string}` : undefined,
		});

		await this.synchronizationService.update(newSynchronization);
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
