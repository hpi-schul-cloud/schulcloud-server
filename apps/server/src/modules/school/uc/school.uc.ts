import { Injectable } from '@nestjs/common';
import { Permission, SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { Action, AllowedAuthorizationObjectType, AuthorizationService } from '@src/modules/authorization';
import { SchoolMigrationService, UserLoginMigrationService } from '@src/modules/user-login-migration';
import { SchoolService } from '../service';
import { OauthMigrationDto } from './dto/oauth-migration.dto';

@Injectable()
export class SchoolUc {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly authService: AuthorizationService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly userLoginMigrationService: UserLoginMigrationService
	) {}

	// TODO: https://ticketsystem.dbildungscloud.de/browse/N21-673 Refactor this and split it up
	async setMigration(
		schoolId: string,
		oauthMigrationPossible: boolean,
		oauthMigrationMandatory: boolean,
		oauthMigrationFinished: boolean,
		userId: string
	): Promise<OauthMigrationDto> {
		await this.authService.checkPermissionByReferences(userId, AllowedAuthorizationObjectType.School, schoolId, {
			action: Action.read,
			requiredPermissions: [Permission.SCHOOL_EDIT],
		});

		const existingUserLoginMigration: UserLoginMigrationDO | null =
			await this.userLoginMigrationService.findMigrationBySchool(schoolId);

		if (existingUserLoginMigration) {
			this.schoolMigrationService.validateGracePeriod(existingUserLoginMigration);
		}

		const updatedUserLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationService.setMigration(
			schoolId,
			oauthMigrationPossible,
			oauthMigrationMandatory,
			oauthMigrationFinished
		);

		if (!existingUserLoginMigration?.closedAt && updatedUserLoginMigration.closedAt) {
			await this.schoolMigrationService.markUnmigratedUsersAsOutdated(schoolId);
		} else if (existingUserLoginMigration?.closedAt && !updatedUserLoginMigration.closedAt) {
			await this.schoolMigrationService.unmarkOutdatedUsers(schoolId);
		}

		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		const migrationDto: OauthMigrationDto = new OauthMigrationDto({
			oauthMigrationPossible: !updatedUserLoginMigration.closedAt ? updatedUserLoginMigration.startedAt : undefined,
			oauthMigrationMandatory: updatedUserLoginMigration.mandatorySince,
			oauthMigrationFinished: updatedUserLoginMigration.closedAt,
			oauthMigrationFinalFinish: updatedUserLoginMigration.finishedAt,
			enableMigrationStart: !!school.officialSchoolNumber,
		});

		return migrationDto;
	}

	async getMigration(schoolId: string, userId: string): Promise<OauthMigrationDto> {
		await this.authService.checkPermissionByReferences(userId, AllowedAuthorizationObjectType.School, schoolId, {
			action: Action.read,
			requiredPermissions: [Permission.SCHOOL_EDIT],
		});

		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		const migrationDto: OauthMigrationDto = new OauthMigrationDto({
			oauthMigrationPossible:
				userLoginMigration && !userLoginMigration.closedAt ? userLoginMigration.startedAt : undefined,
			oauthMigrationMandatory: userLoginMigration ? userLoginMigration.mandatorySince : undefined,
			oauthMigrationFinished: userLoginMigration ? userLoginMigration.closedAt : undefined,
			oauthMigrationFinalFinish: userLoginMigration ? userLoginMigration.finishedAt : undefined,
			enableMigrationStart: !!school.officialSchoolNumber,
		});

		return migrationDto;
	}
}
