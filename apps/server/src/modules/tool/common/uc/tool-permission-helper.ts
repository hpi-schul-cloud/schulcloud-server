import { Injectable } from '@nestjs/common';
import { EntityId, User } from '@shared/domain';
import { AuthorizationContext, AuthorizationService } from '../../../authorization';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';

@Injectable()
export class ToolPermissionHelper {
	constructor(private readonly authorizationService: AuthorizationService) {}

	public async ensureContextPermissions(
		userId: EntityId,
		contextExternalTool: ContextExternalTool,
		context: AuthorizationContext
	): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, contextExternalTool, context);
	}

	public async ensureSchoolPermissions(
		userId: EntityId,
		schoolExternalTool: SchoolExternalTool,
		context: AuthorizationContext
	): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, schoolExternalTool, context);
	}
}
