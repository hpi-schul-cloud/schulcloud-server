import { Injectable } from '@nestjs/common';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { Actions, EntityId, Permission } from '@shared/domain';
import { AuthorizationService } from '../../authorization';
import { SchoolExternalToolService } from '../service/school-external-tool.service';
import { SchoolExternalToolQueryInput } from './dto/school-external-tool.types';
import { CourseExternalToolService } from '../service/course-external-tool.service';
import { AllowedAuthorizationEntityType } from '../../authorization/interfaces';

@Injectable()
export class SchoolExternalToolUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly courseExternalToolService: CourseExternalToolService
	) {}

	async findSchoolExternalTools(
		userId: EntityId,
		query: SchoolExternalToolQueryInput
	): Promise<SchoolExternalToolDO[]> {
		let tools: SchoolExternalToolDO[] = [];
		if (query.schoolId) {
			await this.ensureSchoolPermission(userId, query.schoolId);
			tools = await this.schoolExternalToolService.findSchoolExternalTools({ schoolId: query.schoolId });
		}
		return tools;
	}

	private async ensureSchoolPermission(userId: EntityId, schoolId: EntityId): Promise<void> {
		return this.authorizationService.checkPermissionByReferences(
			userId,
			AllowedAuthorizationEntityType.School,
			schoolId,
			{
				action: Actions.read,
				requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
			}
		);
	}

	async deleteSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<void> {
		await this.ensureSchoolExternalToolPermission(userId, schoolExternalToolId);

		await Promise.all([
			this.courseExternalToolService.deleteBySchoolExternalToolId(schoolExternalToolId),
			this.schoolExternalToolService.deleteSchoolExternalToolById(schoolExternalToolId),
		]);
	}

	private async ensureSchoolExternalToolPermission(userId: EntityId, schoolExternalToolId: EntityId): Promise<void> {
		return this.authorizationService.checkPermissionByReferences(
			userId,
			AllowedAuthorizationEntityType.SchoolExternalTool,
			schoolExternalToolId,
			{
				action: Actions.read,
				requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
			}
		);
	}
}
