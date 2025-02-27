import { Logger } from '@core/logger';
import { Account, AccountService } from '@modules/account';
import { BadDataLoggableException } from '@modules/provisioning/loggable';
import { System } from '@modules/system';
import { UserService } from '@modules/user';
import { UserDo, UserSourceOptions } from '@modules/user/domain';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TspMigrationBatchSummaryLoggable } from './loggable/tsp-migration-batch-summary.loggable';
import { TspMigrationsFetchedLoggable } from './loggable/tsp-migrations-fetched.loggable';
import { TspSyncConfig } from './tsp-sync.config';

@Injectable()
export class TspSyncMigrationService {
	constructor(
		private readonly logger: Logger,
		private readonly userService: UserService,
		private readonly accountService: AccountService,
		private readonly configService: ConfigService<TspSyncConfig, true>
	) {
		this.logger.setContext(TspSyncMigrationService.name);
	}

	public async migrateTspUsers(
		system: System,
		oldToNewMappings: Map<string, string>
	): Promise<{
		totalAmount: number;
		totalUsers: number;
		totalAccounts: number;
	}> {
		const totalIdCount = oldToNewMappings.size;
		this.logger.info(new TspMigrationsFetchedLoggable(totalIdCount));

		const batches = this.getOldIdBatches(oldToNewMappings);

		let totalAmount = 0;
		let totalUsers = 0;
		let totalAccounts = 0;
		for await (const oldIdsBatch of batches) {
			const { users, accounts, accountsForUserId } = await this.loadUsersAndAccounts(oldIdsBatch);
			const updated = this.updateUsersAndAccounts(system.id, oldToNewMappings, users, accountsForUserId);
			await this.saveUsersAndAccounts(users, accounts);

			totalAmount += oldIdsBatch.length;
			totalUsers += updated.usersUpdated;
			totalAccounts += updated.accountsUpdated;

			this.logger.info(
				new TspMigrationBatchSummaryLoggable(
					oldIdsBatch.length,
					updated.usersUpdated,
					updated.accountsUpdated,
					totalAmount,
					totalIdCount
				)
			);
		}

		return {
			totalAmount,
			totalUsers,
			totalAccounts,
		};
	}

	private updateUsersAndAccounts(
		systemId: string,
		oldToNewMappings: Map<string, string>,
		users: UserDo[],
		accountsForUserId: Map<string, Account>
	): { usersUpdated: number; accountsUpdated: number } {
		let usersUpdated = 0;
		let accountsUpdated = 0;
		users.forEach((user) => {
			const oldId = user.sourceOptions?.tspUid;

			if (!oldId) {
				this.logger.warning(
					new BadDataLoggableException(`Can't migrate TSP User. Old tspUid is not set for TSP User: ${user.id ?? ''}`, {
						userId: user.id,
					})
				);
				return;
			}

			const newUid = oldToNewMappings.get(oldId);

			if (!newUid) {
				this.logger.warning(
					new BadDataLoggableException(`Can't migrate TSP User. No new Uid is given for oldId: ${oldId}`, {
						oldId,
					})
				);
				return;
			}

			const newEmailAndUsername = `${newUid}@schul-cloud.org`;

			user.email = newEmailAndUsername;
			user.externalId = newUid;
			user.previousExternalId = oldId;
			user.sourceOptions = new UserSourceOptions({ tspUid: newUid });
			usersUpdated += 1;

			const account = accountsForUserId.get(user.id ?? '');
			if (account) {
				account.username = newEmailAndUsername;
				account.systemId = systemId;
				accountsUpdated += 1;
			}
		});

		return { usersUpdated, accountsUpdated };
	}

	private getOldIdBatches(oldToNewMappings: Map<string, string>): string[][] {
		const oldIds = Array.from(oldToNewMappings.keys());
		const batchSize = this.configService.getOrThrow('TSP_SYNC_MIGRATION_LIMIT', { infer: true });

		const batchCount = Math.ceil(oldIds.length / batchSize);
		const batches: string[][] = [];
		for (let i = 0; i < batchCount; i += 1) {
			const start = i * batchSize;
			const end = Math.min((i + 1) * batchSize, oldIds.length);
			batches.push(oldIds.slice(start, end));
		}

		return batches;
	}

	private async loadUsersAndAccounts(
		tspUids: string[]
	): Promise<{ users: UserDo[]; accounts: Account[]; accountsForUserId: Map<string, Account> }> {
		const users = await this.userService.findByTspUids(tspUids);

		const userIds = users.map((user) => user.id ?? '');
		const accounts = await this.accountService.findMultipleByUserId(userIds);

		const accountsForUserId = new Map<string, Account>();
		accounts.forEach((account) => accountsForUserId.set(account.userId ?? '', account));

		return { users, accounts, accountsForUserId };
	}

	private async saveUsersAndAccounts(users: UserDo[], accounts: Account[]): Promise<void> {
		await this.userService.saveAll(users);
		await this.accountService.saveAll(accounts);
	}
}
