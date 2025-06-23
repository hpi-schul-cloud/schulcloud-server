import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserLoginMigrationDO } from '../../domain';
import { UserLoginMigrationNotFoundLoggableException } from '../../domain/loggable';
import {
	SchoolMigrationService,
	UserLoginMigrationRevertService,
	UserLoginMigrationService,
} from '../../domain/service';

@Injectable()
export class CloseUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly userLoginMigrationRevertService: UserLoginMigrationRevertService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService
	) {}

	public async closeMigration(userId: EntityId, schoolId: EntityId): Promise<UserLoginMigrationDO | undefined> {
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

		const updatedUserLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationService.closeMigration(
			userLoginMigration
		);

		const school = await this.schoolService.getSchoolById(schoolId);

		const hasSchoolMigrated: boolean = this.schoolMigrationService.hasSchoolMigratedInMigrationPhase(
			school,
			updatedUserLoginMigration
		);
		const hasSchoolMigratedUsers: boolean = await this.schoolMigrationService.hasSchoolMigratedUser(schoolId);

		if (!hasSchoolMigratedUsers && !hasSchoolMigrated) {
			await this.userLoginMigrationRevertService.revertUserLoginMigration(updatedUserLoginMigration);

			return undefined;
		}

		await this.schoolMigrationService.removeSourceSystemOfSchool(school, updatedUserLoginMigration);

		await this.schoolMigrationService.markUnmigratedUsersAsOutdated(updatedUserLoginMigration);

		return updatedUserLoginMigration;
	}
}
