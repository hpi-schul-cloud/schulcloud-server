import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Permission, User, UserLoginMigrationDO } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { UserLoginMigrationNotFoundLoggableException, UserLoginMigrationStartLoggableException } from '../loggable';
import { SchoolMigrationService, UserLoginMigrationService } from '../service';

@Injectable()
export class RestartUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly logger: Logger
	) {
		this.logger.setContext(RestartUserLoginMigrationUc.name);
	}

	public async restartMigration(userId: string, schoolId: string): Promise<UserLoginMigrationDO> {
		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		if (!userLoginMigration) {
			throw new UserLoginMigrationNotFoundLoggableException(schoolId);
		}

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			userLoginMigration,
			AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN])
		);

		const updatedUserLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationService.restartMigration(
			userLoginMigration
		);

		await this.schoolMigrationService.unmarkOutdatedUsers(updatedUserLoginMigration);

		this.logger.info(new UserLoginMigrationStartLoggableException(userId, updatedUserLoginMigration.id as string));

		return updatedUserLoginMigration;
	}
}
