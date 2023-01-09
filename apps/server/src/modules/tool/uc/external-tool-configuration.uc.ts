import { Injectable } from '@nestjs/common';
import { Actions, CustomParameterScope, EntityId, Permission, User } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { ExternalToolService } from '../service/external-tool.service';
import { AuthorizationService } from '../../authorization';
import { SchoolService } from '../../school';

@Injectable()
export class ExternalToolConfigurationUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService
	) {}

	async getExternalToolForSchool(
		userId: EntityId,
		externalToolId: EntityId,
		schoolId: EntityId
	): Promise<ExternalToolDO> {
		await this.ensureSchoolPermission(userId, schoolId, Permission.SCHOOL_TOOL_ADMIN);

		const externalToolDO: ExternalToolDO = await this.externalToolService.getExternalToolForScope(
			externalToolId,
			CustomParameterScope.SCHOOL
		);

		if (externalToolDO.isHidden) {
			throw new NotFoundException('Could not find the Tool Template');
		}

		return externalToolDO;
	}

	private async ensureSchoolPermission(userId: EntityId, schoolId: EntityId, permission: Permission) {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		this.authorizationService.checkPermission(user, school, {
			action: Actions.read,
			requiredPermissions: [permission],
		});
	}
}
