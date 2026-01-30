import { AxiosErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import { SchulconnexRestClient } from '@infra/schulconnex-client';
import { AccountService } from '@modules/account';
import { Synchronization, SynchronizationService, SynchronizationStatusModel } from '@modules/synchronization';
import { UserService } from '@modules/user';
import { Inject, Injectable } from '@nestjs/common';
import util from 'util';
import { IDP_CONSOLE_CONFIG_TOKEN, IdpConsoleConfig } from '../idp-console.config';
import {
	ProgressSynchronizationLoggable,
	StartSynchronizationLoggable,
	SucessSynchronizationLoggable,
} from './loggable';
import {
	FailedUpdateLastSyncedAtLoggableException,
	NoUsersToSynchronizationLoggableException,
	SynchronizationUnknownErrorLoggableException,
} from './loggable-exception';

@Injectable()
export class SynchronizationUc {
	constructor(
		@Inject(IDP_CONSOLE_CONFIG_TOKEN) private readonly config: IdpConsoleConfig,
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
			const chunks = this.chunkArray(usersToCheck, this.config.synchronizationChunk);
			const promises = chunks.map((chunk, index) => this.updateLastSyncedAt(index, chunk, systemId));
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
					: new SynchronizationUnknownErrorLoggableException(systemId, error as Error);

			await this.updateSynchronization(
				synchronizationId,
				SynchronizationStatusModel.FAILED,
				0,
				util.inspect(loggable.getLogMessage())
			);
			throw loggable;
		}
	}

	// Should be privat! It is only used for testing.
	// Every parts that need be tested and only avaible from intern,
	// need to be passed from outside by constructor or public methods.
	public async findUsersToSynchronize(systemId: string): Promise<string[]> {
		const usersDownloaded = await this.schulconnexRestClient.getPersonenInfo({ vollstaendig: ['personen'] });

		if (usersDownloaded.length === 0) {
			throw new NoUsersToSynchronizationLoggableException(systemId);
		}
		const usersToCheck = usersDownloaded.map((user) => user.pid);

		return usersToCheck;
	}

	public async updateLastSyncedAt(index: number, usersToCheck: string[], systemId: string): Promise<number> {
		try {
			this.logger.info(
				new ProgressSynchronizationLoggable({
					chunkIndex: index,
					externalUserIdCount: usersToCheck.length,
				})
			);

			const foundUsers = await this.userService.findMultipleByExternalIds(usersToCheck);
			this.logger.info(
				new ProgressSynchronizationLoggable({
					chunkIndex: index,
					externalUserIdCount: usersToCheck.length,
					userWithOneExternalIdCount: foundUsers.length,
				})
			);

			const verifiedUsers = await this.accountService.findByUserIdsAndSystemId(foundUsers, systemId);
			this.logger.info(
				new ProgressSynchronizationLoggable({
					chunkIndex: index,
					externalUserIdCount: usersToCheck.length,
					userWithOneExternalIdCount: foundUsers.length,
					usersWithAccountAndSystem: verifiedUsers.length,
				})
			);

			await this.userService.updateLastSyncedAt(verifiedUsers);

			return verifiedUsers.length;
		} catch (error) {
			throw new FailedUpdateLastSyncedAtLoggableException(systemId, error as Error);
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
