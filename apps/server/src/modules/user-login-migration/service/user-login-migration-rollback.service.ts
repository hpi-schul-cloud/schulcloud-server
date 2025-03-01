import { Logger } from '@core/logger';
import { AccountService } from '@modules/account';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import {
	UserLoginMigrationNotFoundLoggableException,
	UserMigrationRollbackSuccessfulLoggable,
	UserNotMigratedLoggableException,
} from '../loggable';
import { UserLoginMigrationService } from './user-login-migration.service';

@Injectable()
export class UserLoginMigrationRollbackService {
	constructor(
		private readonly userService: UserService,
		private readonly accountService: AccountService,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly logger: Logger
	) {}

	public async rollbackUser(targetUserId: EntityId): Promise<void> {
		const user = await this.userService.findById(targetUserId);
		const account = await this.accountService.findByUserIdOrFail(targetUserId);
		const userLoginMigration = await this.userLoginMigrationService.findMigrationBySchool(user.schoolId);

		if (!userLoginMigration) {
			throw new UserLoginMigrationNotFoundLoggableException(user.schoolId);
		}

		if (!user.lastLoginSystemChange) {
			throw new UserNotMigratedLoggableException(user.id);
		}

		const { externalId } = user;

		user.externalId = user.previousExternalId;
		user.previousExternalId = undefined;
		user.lastLoginSystemChange = undefined;
		if (userLoginMigration.closedAt) {
			user.outdatedSince = userLoginMigration.closedAt;
		}

		account.systemId = userLoginMigration.sourceSystemId;

		await this.userService.save(user);
		await this.accountService.save(account);

		this.logger.info(new UserMigrationRollbackSuccessfulLoggable(user.id, externalId, userLoginMigration.id));
	}
}
