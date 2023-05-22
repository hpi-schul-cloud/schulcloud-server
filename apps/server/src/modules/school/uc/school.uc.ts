import { Injectable, NotFoundException } from '@nestjs/common';
import { SchoolService } from '@src/modules/school/service/school.service';
import { Permission } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolMigrationService } from '@src/modules/user-login-migration/service';
import { Action, AuthorizableReferenceType, AuthorizationService } from '@src/modules/authorization';
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
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);
		const migrationStartedAt: Date | undefined = school.oauthMigrationStart;

		const shouldRestartMigration: boolean = this.isRestartMigrationRequired(
			school,
			oauthMigrationPossible,
			oauthMigrationMandatory,
			oauthMigrationFinished
		);

		if (shouldRestartMigration) {
			this.schoolMigrationService.validateGracePeriod(school);
			await this.schoolMigrationService.restartMigration(schoolId);
		}

		const migrationDto: OauthMigrationDto = await this.schoolService.setMigration(
			schoolId,
			oauthMigrationPossible,
			oauthMigrationMandatory,
			oauthMigrationFinished
		);

		if (oauthMigrationFinished) {
			await this.schoolMigrationService.completeMigration(schoolId, migrationStartedAt);
		}

		return migrationDto;
	}

	async getMigration(schoolId: string, userId: string): Promise<OauthMigrationDto> {
		await this.authService.checkPermissionByReferences(userId, AuthorizableReferenceType.School, schoolId, {
			action: Action.read,
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

	private isRestartMigrationRequired(
		school: SchoolDO,
		oauthMigrationPossible: boolean,
		oauthMigrationMandatory: boolean,
		oauthMigrationFinished: boolean
	): boolean {
		const hasSchoolOauthMigrationFinished = !!school.oauthMigrationFinished;
		const isOauthMigrationMandatory = oauthMigrationMandatory === !!school.oauthMigrationMandatory;
		const isOauthMigrationNotFinished = !oauthMigrationFinished;
		const isRequired =
			hasSchoolOauthMigrationFinished &&
			oauthMigrationPossible &&
			isOauthMigrationMandatory &&
			isOauthMigrationNotFinished;
		return isRequired;
	}
}
