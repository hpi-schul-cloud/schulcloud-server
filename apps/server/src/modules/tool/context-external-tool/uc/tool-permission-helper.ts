import { Injectable } from '@nestjs/common';
import { EntityId, User } from '@shared/domain';
import { AuthorizationContext, AuthorizationService } from '@src/modules/authorization';
import { ContextExternalTool } from '../domain';

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
}
