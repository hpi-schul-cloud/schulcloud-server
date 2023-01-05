import { Injectable } from '@nestjs/common';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { Actions, EntityId, Permission, User } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { AuthorizationService } from '../../authorization';
import { SchoolExternalToolService } from '../service/school-external-tool.service';
import { SchoolService } from '../../school';
import { SchoolExternalToolQueryInput } from './dto/school-external-tool.types';

@Injectable()
export class SchoolExternalToolUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly schoolService: SchoolService
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
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		this.authorizationService.checkPermission(user, school, {
			action: Actions.read,
			requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
		});
	}
}
