import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { UserLoginMigrationDO } from '@shared/domain/domainobject/user-login-migration.do';
import { User } from '@shared/domain/entity/user.entity';
import { Permission } from '@shared/domain/interface/permission.enum';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { Action } from '@src/modules/authorization/types/action.enum';
import { UserLoginMigrationGracePeriodExpiredLoggableException } from '../error/user-login-migration-grace-period-expired-loggable.exception';
import { UserLoginMigrationNotFoundLoggableException } from '../error/user-login-migration-not-found.loggable-exception';
import { SchoolMigrationService } from '../service/school-migration.service';
import { UserLoginMigrationRevertService } from '../service/user-login-migration-revert.service';
import { UserLoginMigrationService } from '../service/user-login-migration.service';

@Injectable()
export class CloseUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly userLoginMigrationRevertService: UserLoginMigrationRevertService,
		private readonly authorizationService: AuthorizationService
	) {}

	async closeMigration(userId: EntityId, schoolId: EntityId): Promise<UserLoginMigrationDO | undefined> {
		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		if (!userLoginMigration) {
			throw new UserLoginMigrationNotFoundLoggableException(schoolId);
		}

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, userLoginMigration, {
			requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
			action: Action.write,
		});

		if (userLoginMigration.finishedAt && this.isGracePeriodExpired(userLoginMigration)) {
			throw new UserLoginMigrationGracePeriodExpiredLoggableException(
				userLoginMigration.id as string,
				userLoginMigration.finishedAt
			);
		} else if (userLoginMigration.closedAt) {
			return userLoginMigration;
		} else {
			const updatedUserLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationService.closeMigration(
				schoolId
			);

			const hasSchoolMigratedUser: boolean = await this.schoolMigrationService.hasSchoolMigratedUser(schoolId);

			if (!hasSchoolMigratedUser) {
				await this.userLoginMigrationRevertService.revertUserLoginMigration(updatedUserLoginMigration);
				return undefined;
			}
			await this.schoolMigrationService.markUnmigratedUsersAsOutdated(schoolId);

			return updatedUserLoginMigration;
		}
	}

	private isGracePeriodExpired(userLoginMigration: UserLoginMigrationDO): boolean {
		const isGracePeriodExpired: boolean =
			!!userLoginMigration.finishedAt && Date.now() >= userLoginMigration.finishedAt.getTime();

		return isGracePeriodExpired;
	}
}
