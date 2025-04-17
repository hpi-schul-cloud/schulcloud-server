import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { SchoolService } from '@modules/school';
import type { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { SchoolExternalToolService } from '../../school-external-tool';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { type SchoolExternalToolUtilization } from '../domain';
import { ExternalToolUtilizationService } from '../service';

@Injectable()
export class SchoolExternalToolUtilizationUc {
	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly externalToolUtilizationService: ExternalToolUtilizationService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService
	) {}

	public async getUtilizationForSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: EntityId
	): Promise<SchoolExternalToolUtilization> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);

		const context = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		const schoolExternalToolUtilization = await this.externalToolUtilizationService.getUtilizationForSchoolExternalTool(
			schoolExternalToolId
		);

		return schoolExternalToolUtilization;
	}
}
