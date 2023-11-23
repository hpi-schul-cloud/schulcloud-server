import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/';
import { LegacySchoolDo, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { UserLoginMigrationMandatoryLoggable, UserLoginMigrationNotFoundLoggableException } from '../loggable';
import { UserLoginMigrationService } from '../service';

@Injectable()
export class ToggleUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService,
		private readonly logger: Logger
	) {}

	async setMigrationMandatory(userId: EntityId, schoolId: EntityId, mandatory: boolean): Promise<UserLoginMigrationDO> {
		await this.checkPermission(userId, schoolId);

		let userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		if (!userLoginMigration) {
			throw new UserLoginMigrationNotFoundLoggableException(schoolId);
		}

		userLoginMigration = await this.userLoginMigrationService.setMigrationMandatory(userLoginMigration, mandatory);

		this.logger.debug(new UserLoginMigrationMandatoryLoggable(userId, userLoginMigration.id, mandatory));

		return userLoginMigration;
	}

	private async checkPermission(userId: string, schoolId: string): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);
	}
}
