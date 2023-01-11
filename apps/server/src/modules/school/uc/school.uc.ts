import { Injectable } from '@nestjs/common';
import { SchoolService } from '@src/modules/school/service/school.service';
import { Actions, Permission } from '@shared/domain';
import { AuthorizationService } from '../../authorization';
import { AllowedAuthorizationEntityType } from '../../authorization/interfaces';
import { MigrationDto } from '../dto/migration.dto';

@Injectable()
export class SchoolUc {
	constructor(readonly schoolService: SchoolService, readonly authService: AuthorizationService) {}

	async setMigration(
		schoolId: string,
		oauthMigrationPossible: boolean,
		oauthMigrationMandatory: boolean,
		oauthMigrationFinished: boolean,
		userId: string
	): Promise<MigrationDto> {
		await this.authService.checkPermissionByReferences(userId, AllowedAuthorizationEntityType.School, schoolId, {
			action: Actions.read,
			requiredPermissions: [Permission.SCHOOL_EDIT],
		});
		const migrationDto: MigrationDto = await this.schoolService.setMigration(
			schoolId,
			oauthMigrationPossible,
			oauthMigrationMandatory,
			oauthMigrationFinished
		);

		return migrationDto;
	}

	async getMigration(schoolId: string, userId: string): Promise<MigrationDto> {
		await this.authService.checkPermissionByReferences(userId, AllowedAuthorizationEntityType.School, schoolId, {
			action: Actions.read,
			requiredPermissions: [Permission.SCHOOL_EDIT],
		});
		const migrationDto: MigrationDto = await this.schoolService.getMigration(schoolId);

		return migrationDto;
	}
}
