import { AccountService } from '@modules/account/services/account.service';
import { AccountDto } from '@modules/account/services/dto';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { UserMigrationDatabaseOperationFailedLoggableException } from '../loggable';

@Injectable()
export class UserMigrationService {
	constructor(private readonly userService: UserService, private readonly accountService: AccountService) {}

	async migrateUser(currentUserId: string, externalUserId: string, targetSystemId: string): Promise<void> {
		const userDO: UserDO = await this.userService.findById(currentUserId);
		const account: AccountDto = await this.accountService.findByUserIdOrFail(currentUserId);

		const userDOCopy: UserDO = new UserDO({ ...userDO });
		const accountCopy: AccountDto = new AccountDto({ ...account });

		try {
			await this.doMigration(userDO, externalUserId, account, targetSystemId);
		} catch (error: unknown) {
			await this.rollbackMigration(userDOCopy, accountCopy);

			throw new UserMigrationDatabaseOperationFailedLoggableException(currentUserId, error);
		}
	}

	private async doMigration(
		userDO: UserDO,
		externalUserId: string,
		account: AccountDto,
		targetSystemId: string
	): Promise<void> {
		userDO.previousExternalId = userDO.externalId;
		userDO.externalId = externalUserId;
		userDO.lastLoginSystemChange = new Date();
		await this.userService.save(userDO);

		account.systemId = targetSystemId;
		await this.accountService.save(account);
	}

	private async rollbackMigration(userDOCopy: UserDO, accountCopy: AccountDto): Promise<void> {
		await this.userService.save(userDOCopy);
		await this.accountService.save(accountCopy);
	}
}
