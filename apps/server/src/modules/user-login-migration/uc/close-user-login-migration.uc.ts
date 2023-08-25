import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { EntityId, Permission, User, UserLoginMigrationDO } from '@shared/domain';
import { Action, AuthorizationService } from '@src/modules/authorization';
import {
	UserLoginMigrationGracePeriodExpiredLoggableException,
	UserLoginMigrationNotFoundLoggableException,
} from '../error';
import { SchoolMigrationService, UserLoginMigrationRevertService, UserLoginMigrationService } from '../service';

@Injectable()
export class CloseUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly userLoginMigrationRevertService: UserLoginMigrationRevertService,
		private readonly authorizationService: AuthorizationService
	) {}

	async closeMigration(userId: EntityId, schoolId: EntityId): Promise<UserLoginMigrationDO> {
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
				const revertedUserLoginMigration: UserLoginMigrationDO =
					await this.userLoginMigrationRevertService.revertUserLoginMigration(updatedUserLoginMigration);

				return revertedUserLoginMigration;
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
