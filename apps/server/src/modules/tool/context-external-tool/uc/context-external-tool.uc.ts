import { Injectable } from '@nestjs/common';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { ContextExternalToolDO, EntityId, Permission } from '@shared/domain';
import { ContextTypeMapper } from './context-type.mapper';
import { ContextExternalToolService, ContextExternalToolValidationService } from '../service';
import { ToolContextType } from '../interface';
import { ContextExternalTool } from './dto';

@Injectable()
export class ContextExternalToolUc {
	constructor(
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly authorizationService: AuthorizationService,
		private readonly contextExternalToolValidationService: ContextExternalToolValidationService
	) {}

	async createContextExternalTool(
		userId: EntityId,
		contextExternalTool: ContextExternalTool
	): Promise<ContextExternalToolDO> {
		await this.ensureContextPermission(userId, contextExternalTool.contextId, contextExternalTool.contextType);

		await this.contextExternalToolValidationService.validate(contextExternalTool);

		const createdTool: ContextExternalToolDO = await this.contextExternalToolService.createContextExternalTool(
			contextExternalTool
		);

		return createdTool;
	}

	private async ensureContextPermission(
		userId: EntityId,
		contextId: EntityId,
		contextType: ToolContextType
	): Promise<void> {
		return this.authorizationService.checkPermissionByReferences(
			userId,
			ContextTypeMapper.mapContextTypeToAllowedAuthorizationEntityType(contextType),
			contextId,
			{
				action: Action.write,
				requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			}
		);
	}
}
