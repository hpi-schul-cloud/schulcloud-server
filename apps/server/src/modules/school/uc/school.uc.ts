import { Injectable } from '@nestjs/common';
import { SchoolService } from '@src/modules/school/service/school.service';
import { Actions, Permission } from '@shared/domain';
import { MigrationResponse } from '../controller/dto';
import { AuthorizationService } from '../../authorization';
import { AllowedAuthorizationEntityType } from '../../authorization/interfaces';

@Injectable()
export class SchoolUc {
	constructor(readonly schoolService: SchoolService, readonly authService: AuthorizationService) {}

	async setMigration(
		schoolId: string,
		oauthMigrationPossible: boolean,
		oauthMigrationMandatory: boolean,
		userId: string
	): Promise<MigrationResponse> {
		await this.authService.checkPermissionByReferences(userId, AllowedAuthorizationEntityType.School, schoolId, {
			action: Actions.read,
			requiredPermissions: [Permission.SCHOOL_EDIT],
		});
		const migrationResponse: MigrationResponse = await this.schoolService.setMigration(
			schoolId,
			oauthMigrationPossible,
			oauthMigrationMandatory
		);

		return migrationResponse;
	}

	async getMigration(schoolId: string, userId: string): Promise<MigrationResponse> {
		await this.authService.checkPermissionByReferences(userId, AllowedAuthorizationEntityType.School, schoolId, {
			action: Actions.read,
			requiredPermissions: [Permission.SCHOOL_EDIT],
		});
		const migrationResponse: MigrationResponse = await this.schoolService.getMigration(schoolId);

		return migrationResponse;
	}
}
