import { Injectable } from '@nestjs/common';
import { Permission, LegacySchoolDo, UserLoginMigrationDO } from '@shared/domain';
import { Action, AuthorizableReferenceType, AuthorizationService } from '@src/modules/authorization';
import {
	SchoolMigrationService,
	UserLoginMigrationRevertService,
	UserLoginMigrationService,
} from '@src/modules/user-login-migration';
import { LegacySchoolService } from '../service';
import { OauthMigrationDto } from './dto/oauth-migration.dto';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@Injectable()
export class LegacySchoolUc {
	constructor(
		private readonly schoolService: LegacySchoolService,
		private readonly authService: AuthorizationService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly userLoginMigrationRevertService: UserLoginMigrationRevertService
	) {}

	// TODO: https://ticketsystem.dbildungscloud.de/browse/N21-673 Refactor this and split it up
	async setMigration(
		schoolId: string,
		oauthMigrationPossible: boolean,
		oauthMigrationMandatory: boolean,
		oauthMigrationFinished: boolean,
		userId: string
	): Promise<OauthMigrationDto> {
		await this.authService.checkPermissionByReferences(userId, AuthorizableReferenceType.School, schoolId, {
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
			const hasSchoolMigratedUser = await this.schoolMigrationService.hasSchoolMigratedUser(schoolId);

			if (!hasSchoolMigratedUser) {
				await this.userLoginMigrationRevertService.revertUserLoginMigration(updatedUserLoginMigration);
			} else {
				await this.schoolMigrationService.markUnmigratedUsersAsOutdated(schoolId);
			}
		} else if (existingUserLoginMigration?.closedAt && !updatedUserLoginMigration.closedAt) {
			await this.schoolMigrationService.unmarkOutdatedUsers(schoolId);
		}

		const school: LegacySchoolDo = await this.schoolService.getSchoolById(schoolId);

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
		await this.authService.checkPermissionByReferences(userId, AuthorizableReferenceType.School, schoolId, {
			action: Action.read,
			requiredPermissions: [Permission.SCHOOL_EDIT],
		});

		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		const school: LegacySchoolDo = await this.schoolService.getSchoolById(schoolId);

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
