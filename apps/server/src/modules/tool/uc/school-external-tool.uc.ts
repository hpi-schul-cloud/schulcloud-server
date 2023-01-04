import { Injectable } from '@nestjs/common';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { EntityId, Permission, User } from '@shared/domain';
import { AuthorizationService } from '../../authorization';
import { SchoolExternalToolService } from '../service/school-external-tool.service';

@Injectable()
export class SchoolExternalToolUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly schoolExternalToolService: SchoolExternalToolService
	) {}

	async findSchoolExternalTools(
		userId: EntityId,
		query: Partial<SchoolExternalToolDO>
	): Promise<SchoolExternalToolDO[]> {
		await this.ensurePermission(userId);
		const tools: SchoolExternalToolDO[] = await this.schoolExternalToolService.findSchoolExternalTools(query);
		return tools;
	}

	private async ensurePermission(userId: string) {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.SCHOOL_TOOL_ADMIN]);
	}
}
