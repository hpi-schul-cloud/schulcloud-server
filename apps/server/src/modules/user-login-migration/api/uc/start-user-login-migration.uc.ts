import { Logger } from '@core/logger';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserLoginMigrationDO } from '../../domain';
import {
	SchoolNumberMissingLoggableException,
	UserLoginMigrationAlreadyClosedLoggableException,
	UserLoginMigrationStartLoggable,
} from '../../domain/loggable';
import { UserLoginMigrationService } from '../../domain/service';

@Injectable()
export class StartUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService,
		private readonly logger: Logger
	) {
		this.logger.setContext(StartUserLoginMigrationUc.name);
	}

	public async startMigration(userId: EntityId, schoolId: EntityId): Promise<UserLoginMigrationDO> {
		await this.checkPreconditions(userId, schoolId);

		let userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		if (userLoginMigration && userLoginMigration.closedAt) {
			throw new UserLoginMigrationAlreadyClosedLoggableException(userLoginMigration.closedAt, userLoginMigration.id);
		}

		if (!userLoginMigration) {
			userLoginMigration = await this.userLoginMigrationService.startMigration(schoolId);

			this.logger.info(new UserLoginMigrationStartLoggable(userId, userLoginMigration.id));
		}

		return userLoginMigration;
	}

	private async checkPreconditions(userId: string, schoolId: string): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school = await this.schoolService.getSchoolById(schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		if (!school.officialSchoolNumber) {
			throw new SchoolNumberMissingLoggableException(schoolId);
		}
	}
}
