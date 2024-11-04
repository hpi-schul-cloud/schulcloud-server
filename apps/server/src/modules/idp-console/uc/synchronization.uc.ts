import { SchulconnexResponse, SchulconnexRestClient } from '@infra/schulconnex-client';
import { Synchronization, SynchronizationService, SynchronizationStatusModel } from '@modules/synchronization';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { ErrorLogMessage } from '@src/core/logger/types';
import { AccountService } from '@src/modules/account';
import { SynchronizationConfig } from '../interface';
import { StartSynchronizationLoggable, SucessSynchronizationLoggable } from './loggable';
import {
	FailedUpdateLastSyncedAtLoggableException,
	NoUsersToSynchronizationLoggableException,
	SynchronizationUnknownErrorLoggableException,
} from './loggable-exception';

@Injectable()
export class SynchronizationUc {
	constructor(
		private readonly configService: ConfigService<SynchronizationConfig, true>,
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
		const usersDownloaded: SchulconnexResponse[] = await this.schulconnexRestClient.getPersonenInfo({});

		if (usersDownloaded.length === 0) {
			throw new NoUsersToSynchronizationLoggableException(systemId);
		}
		usersToCheck = usersDownloaded.map((user) => user.pid);

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
