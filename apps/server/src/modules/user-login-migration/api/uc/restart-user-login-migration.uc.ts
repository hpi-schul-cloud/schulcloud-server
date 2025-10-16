import { Logger } from '@core/logger';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Permission } from '@shared/domain/interface';
import { UserLoginMigrationDO } from '../../domain';
import { UserLoginMigrationNotFoundLoggableException, UserLoginMigrationStartLoggable } from '../../domain/loggable';
import { SchoolMigrationService, UserLoginMigrationService } from '../../domain/service';

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

		await this.schoolMigrationService.restoreSourceSystemOfSchool(schoolId, updatedUserLoginMigration);

		await this.schoolMigrationService.unmarkOutdatedUsers(updatedUserLoginMigration);

		this.logger.info(new UserLoginMigrationStartLoggable(userId, updatedUserLoginMigration.id));

		return updatedUserLoginMigration;
	}
}
