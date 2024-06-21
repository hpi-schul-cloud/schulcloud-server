import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserLoginMigrationNotFoundLoggableException } from '../loggable';
import { SchoolMigrationService, UserLoginMigrationRevertService, UserLoginMigrationService } from '../service';

@Injectable()
export class CloseUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly userLoginMigrationRevertService: UserLoginMigrationRevertService,
		private readonly authorizationService: AuthorizationService
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

		const hasSchoolMigratedUser: boolean = await this.schoolMigrationService.hasSchoolMigratedUser(schoolId);

		if (!hasSchoolMigratedUser) {
			await this.userLoginMigrationRevertService.revertUserLoginMigration(updatedUserLoginMigration);

			return undefined;
		}

		await this.schoolMigrationService.markUnmigratedUsersAsOutdated(updatedUserLoginMigration);

		return updatedUserLoginMigration;
	}
}
