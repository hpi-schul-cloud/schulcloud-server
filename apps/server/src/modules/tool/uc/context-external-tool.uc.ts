import { Injectable } from '@nestjs/common';
import { Actions, ContextExternalToolDO, EntityId, Permission } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { ToolContextType } from '@src/modules/tool/interface';
import { ContextTypeMapper } from '@src/modules/tool/uc/mapper';
import { ContextExternalTool } from './dto';
import { ContextExternalToolService } from '../service';

@Injectable()
export class ContextExternalToolUc {
	constructor(
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly authorizationService: AuthorizationService
	) {}

	// TODO: testme
	async createContextExternalTool(
		userId: EntityId,
		contextExternalTool: ContextExternalTool
	): Promise<ContextExternalToolDO> {
		await this.ensureContextPermission(userId, contextExternalTool.contextId, contextExternalTool.contextType);
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
				action: Actions.read,
				requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			}
		);
	}
}
