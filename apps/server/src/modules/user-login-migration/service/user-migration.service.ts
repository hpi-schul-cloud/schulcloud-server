import { AccountService, Account } from '@modules/account';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import {
	UserMigrationDatabaseOperationFailedLoggableException,
	UserLoginMigrationUserAlreadyMigratedLoggableException,
} from '../loggable';

@Injectable()
export class UserMigrationService {
	constructor(
		private readonly userService: UserService,
		private readonly accountService: AccountService,
		private readonly logger: Logger
	) {}

	async migrateUser(currentUserId: EntityId, externalUserId: string, targetSystemId: EntityId): Promise<void> {
		await this.checkForExternalIdDuplicatesAndThrow(externalUserId, targetSystemId);

		const userDO: UserDO = await this.userService.findById(currentUserId);
		const account: Account = await this.accountService.findByUserIdOrFail(currentUserId);

		const userDOCopy: UserDO = new UserDO({ ...userDO });
		const accountCopy: Account = new Account(account.getProps());

		try {
			await this.doMigration(userDO, externalUserId, account, targetSystemId);
		} catch (error: unknown) {
			await this.tryRollbackMigration(currentUserId, userDOCopy, accountCopy);

			throw new UserMigrationDatabaseOperationFailedLoggableException(currentUserId, 'migration', error);
		}
	}

	private async doMigration(
		userDO: UserDO,
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

	private async tryRollbackMigration(currentUserId: EntityId, userDOCopy: UserDO, accountCopy: Account): Promise<void> {
		try {
			await this.userService.save(userDOCopy);
			await this.accountService.save(accountCopy);
		} catch (error: unknown) {
			this.logger.warning(new UserMigrationDatabaseOperationFailedLoggableException(currentUserId, 'rollback', error));
		}
	}

	private async checkForExternalIdDuplicatesAndThrow(externalUserId: string, targetSystemId: EntityId) {
		const existingUser: UserDO | null = await this.userService.findByExternalId(externalUserId, targetSystemId);
		if (existingUser) {
			throw new UserLoginMigrationUserAlreadyMigratedLoggableException(externalUserId);
		}
	}
}
