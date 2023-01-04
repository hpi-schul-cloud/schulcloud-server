import { Injectable } from '@nestjs/common';
import { CustomParameterScope, EntityId, Permission, User } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { ConfigurationScope } from '../interface';
import { ExternalToolService } from '../service/external-tool.service';
import { AuthorizationService } from '../../authorization';

@Injectable()
export class ExternalToolConfigurationUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly authorizationService: AuthorizationService
	) {}

	async getExternalToolForScope(
		userId: EntityId,
		externalToolId: EntityId,
		scope: ConfigurationScope // For later use with School and Course
	): Promise<ExternalToolDO> {
		await this.ensurePermission(userId, Permission.SCHOOL_TOOL_ADMIN);

		const externalToolDO: ExternalToolDO = await this.externalToolService.getExternalToolForScope(
			externalToolId,
			CustomParameterScope.SCHOOL
		);

		if (externalToolDO.isHidden) {
			throw new NotFoundException('Could not find the Tool Template');
		}

		return externalToolDO;
	}

	private async ensurePermission(userId: EntityId, permission: Permission) {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [permission]);
	}
}
