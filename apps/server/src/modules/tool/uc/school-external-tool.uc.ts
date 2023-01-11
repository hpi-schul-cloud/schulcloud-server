import { Injectable } from '@nestjs/common';
import { Actions, EntityId, Permission } from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { AuthorizationService } from '@src/modules/authorization';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { SchoolExternalToolService } from '../service/school-external-tool.service';
import { SchoolExternalToolQueryInput } from './dto/school-external-tool.types';

@Injectable()
export class SchoolExternalToolUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly schoolExternalToolService: SchoolExternalToolService
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

	private async ensureSchoolPermission(userId: EntityId, schoolId: EntityId) {
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
}
