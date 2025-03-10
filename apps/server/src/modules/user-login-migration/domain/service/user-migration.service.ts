import { Logger } from '@core/logger';
import { Account, AccountService } from '@modules/account';
import { UserDo, UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { UserLoginMigrationDO } from '../do';
import {
	UserLoginMigrationUserAlreadyMigratedLoggableException,
	UserMigrationDatabaseOperationFailedLoggableException,
} from '../loggable';

@Injectable()
export class UserMigrationService {
	constructor(
		private readonly userService: UserService,
		private readonly accountService: AccountService,
		private readonly logger: Logger
	) {}

	public async migrateUser(currentUserId: EntityId, externalUserId: string, targetSystemId: EntityId): Promise<void> {
		await this.checkForExternalIdDuplicatesAndThrow(externalUserId, targetSystemId);

		const userDO = await this.userService.findById(currentUserId);
		const account = await this.accountService.findByUserIdOrFail(currentUserId);

		const userDOCopy = new UserDo({ ...userDO });
		const accountCopy = new Account(account.getProps());

		try {
			await this.doMigration(userDO, externalUserId, account, targetSystemId);
		} catch (error: unknown) {
			await this.tryRollbackMigration(currentUserId, userDOCopy, accountCopy);

			throw new UserMigrationDatabaseOperationFailedLoggableException(currentUserId, 'migration', error);
		}
	}

	public async updateExternalUserId(userId: string, newExternalUserId: string): Promise<void> {
		const userDO = await this.userService.findById(userId);
		userDO.externalId = newExternalUserId;
		await this.userService.save(userDO);
	}

	public hasUserMigratedInMigrationPhase(userDO: UserDo, userLoginMigrationDO: UserLoginMigrationDO): boolean {
		if (!userDO.externalId || !userDO.lastLoginSystemChange || userLoginMigrationDO.closedAt) {
			return false;
		}
		return userDO.lastLoginSystemChange >= userLoginMigrationDO.startedAt;
	}

	private async doMigration(
		userDO: UserDo,
		externalUserId: string,
		account: Account,
		targetSystemId: string
	): Promise<void> {
		userDO.previousExternalId = userDO.externalId;
		userDO.externalId = externalUserId;
		userDO.lastLoginSystemChange = new Date();
		await this.userService.save(userDO);

		account.systemId = targetSystemId;
		await this.accountService.save(account);
	}

	private async tryRollbackMigration(currentUserId: EntityId, userDOCopy: UserDo, accountCopy: Account): Promise<void> {
		try {
			await this.userService.save(userDOCopy);
			await this.accountService.save(accountCopy);
		} catch (error: unknown) {
			this.logger.warning(new UserMigrationDatabaseOperationFailedLoggableException(currentUserId, 'rollback', error));
		}
	}

	private async checkForExternalIdDuplicatesAndThrow(externalUserId: string, targetSystemId: EntityId): Promise<void> {
		const existingUser = await this.userService.findByExternalId(externalUserId, targetSystemId);
		if (existingUser) {
			throw new UserLoginMigrationUserAlreadyMigratedLoggableException(externalUserId);
		}
	}
}
