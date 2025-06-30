import { SchulconnexRestClient } from '@infra/schulconnex-client';
import { Synchronization, SynchronizationService, SynchronizationStatusModel } from '@modules/synchronization';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@core/logger';
import { AccountService } from '@modules/account';
import { StartSynchronizationLoggable, SucessSynchronizationLoggable } from './loggable';
import {
	FailedUpdateLastSyncedAtLoggableException,
	NoUsersToSynchronizationLoggableException,
	SynchronizationUnknownErrorLoggableException,
} from './loggable-exception';
import { IdpConsoleConfig } from '../idp-console.config';
import { AxiosErrorLoggable } from '@core/error/loggable';

@Injectable()
export class SynchronizationUc {
	constructor(
		private readonly configService: ConfigService<IdpConsoleConfig, true>,
		private readonly schulconnexRestClient: SchulconnexRestClient,
		private readonly synchronizationService: SynchronizationService,
		private readonly userService: UserService,
		private readonly accountService: AccountService,
		private readonly logger: Logger
	) {
		this.logger.setContext(SynchronizationUc.name);
	}

	public async updateSystemUsersLastSyncedAt(systemId: string): Promise<void> {
		this.logger.info(new StartSynchronizationLoggable(systemId));

		const synchronizationId = await this.synchronizationService.createSynchronization(systemId);

		try {
			const usersToCheck = await this.findUsersToSynchronize(systemId);
			const chunkSize = this.configService.get('SYNCHRONIZATION_CHUNK', { infer: true });
			const chunks = this.chunkArray(usersToCheck, chunkSize);
			const promises = chunks.map((chunk) => this.updateLastSyncedAt(chunk, systemId));
			const results = await Promise.all(promises);
			const userSyncCount = results.reduce((acc, curr) => +acc + +curr, 0);

			await this.updateSynchronization(synchronizationId, SynchronizationStatusModel.SUCCESS, userSyncCount);
			this.logger.info(new SucessSynchronizationLoggable(systemId, userSyncCount));
		} catch (error) {
			const loggable =
				error instanceof NoUsersToSynchronizationLoggableException ||
				error instanceof FailedUpdateLastSyncedAtLoggableException ||
				error instanceof AxiosErrorLoggable
					? error
					: new SynchronizationUnknownErrorLoggableException(systemId);

			await this.updateSynchronization(
				synchronizationId,
				SynchronizationStatusModel.FAILED,
				0,
				JSON.stringify(loggable.getLogMessage())
			);
			throw loggable;
		}
	}

	// Should be privat! It is only used for testing.
	// Every parts that need be tested and only avaible from intern,
	// need to be passed from outside by constructor or public methods.
	public async findUsersToSynchronize(systemId: string): Promise<string[]> {
		const usersDownloaded = await this.schulconnexRestClient.getPersonenInfo({});

		if (usersDownloaded.length === 0) {
			throw new NoUsersToSynchronizationLoggableException(systemId);
		}
		const usersToCheck = usersDownloaded.map((user) => user.pid);

		return usersToCheck;
	}

	public async updateLastSyncedAt(usersToCheck: string[], systemId: string): Promise<number> {
		try {
			const foundUsers = await this.userService.findMultipleByExternalIds(usersToCheck);
			const verifiedUsers = await this.accountService.findByUserIdsAndSystemId(foundUsers, systemId);

			await this.userService.updateLastSyncedAt(verifiedUsers);

			return verifiedUsers.length;
		} catch {
			throw new FailedUpdateLastSyncedAtLoggableException(systemId);
		}
	}

	// Should be privat! It is only used for testing.
	// Every parts that need be tested and only avaible from intern,
	// need to be passed from outside by constructor or public methods.
	public async updateSynchronization(
		synchronizationId: string,
		status: SynchronizationStatusModel,
		userSyncCount: number,
		errorMessage?: string
	): Promise<void> {
		const newSynchronization = new Synchronization({
			id: synchronizationId,
			status,
			count: userSyncCount,
			failureCause: errorMessage ? errorMessage : undefined,
		});

		await this.synchronizationService.update(newSynchronization);
	}

	// Should be privat! It is only used for testing.
	// Every parts that need be tested and only avaible from intern,
	// need to be passed from outside by constructor or public methods.
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
