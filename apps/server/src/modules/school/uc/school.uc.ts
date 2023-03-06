import { Injectable, NotFoundException } from '@nestjs/common';
import { SchoolService } from '@src/modules/school/service/school.service';
import { Actions, Permission } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolMigrationService } from '@src/modules/user-login-migration/service';
import { AllowedAuthorizationEntityType, AuthorizationService } from '@src/modules/authorization';
import { OauthMigrationDto } from '../dto/oauth-migration.dto';
import { PublicSchoolResponse } from '../controller/dto/public.school.response';
import { SchoolUcMapper } from '../mapper/school.uc.mapper';

@Injectable()
export class SchoolUc {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly authService: AuthorizationService,
		private readonly schoolMigrationService: SchoolMigrationService
	) {}

	async setMigration(
		schoolId: string,
		oauthMigrationPossible: boolean,
		oauthMigrationMandatory: boolean,
		oauthMigrationFinished: boolean,
		userId: string
	): Promise<OauthMigrationDto> {
		await this.authService.checkPermissionByReferences(userId, AllowedAuthorizationEntityType.School, schoolId, {
			action: Actions.read,
			requiredPermissions: [Permission.SCHOOL_EDIT],
		});
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		// TODO: Please think about the mandatory (validation?) and move this to a private function with a describing name
		const shouldRestartMigration =
			!!school.oauthMigrationFinished &&
			oauthMigrationPossible &&
			oauthMigrationMandatory === !!school.oauthMigrationMandatory &&
			!oauthMigrationFinished;

		if (shouldRestartMigration) {
			await this.schoolMigrationService.restartMigration(schoolId);
		}

		const migrationDto: OauthMigrationDto = await this.schoolService.setMigration(
			schoolId,
			oauthMigrationPossible,
			oauthMigrationMandatory,
			oauthMigrationFinished
		);

		if (oauthMigrationFinished) {
			await this.schoolMigrationService.completeMigration(schoolId);
		}

		return migrationDto;
	}

	async getMigration(schoolId: string, userId: string): Promise<OauthMigrationDto> {
		await this.authService.checkPermissionByReferences(userId, AllowedAuthorizationEntityType.School, schoolId, {
			action: Actions.read,
			requiredPermissions: [Permission.SCHOOL_EDIT],
		});
		const migrationDto: OauthMigrationDto = await this.schoolService.getMigration(schoolId);

		return migrationDto;
	}

	async getPublicSchoolData(schoolnumber: string): Promise<PublicSchoolResponse> {
		const schoolDO: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(schoolnumber);
		if (schoolDO) {
			const response: PublicSchoolResponse = SchoolUcMapper.mapDOToPublicResponse(schoolDO);
			return response;
		}
		throw new NotFoundException(`No school found for schoolnumber: ${schoolnumber}`);
	}
}
