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
		return this.schoolService.setMigration(schoolId, oauthMigrationPossible, oauthMigrationMandatory);
	}

	async getMigration(schoolId: string, userId: string): Promise<MigrationResponse> {
		await this.authService.checkPermissionByReferences(userId, AllowedAuthorizationEntityType.School, schoolId, {
			action: Actions.read,
			requiredPermissions: [Permission.SCHOOL_EDIT],
		});
		return this.schoolService.getMigration(schoolId);
	}
}
