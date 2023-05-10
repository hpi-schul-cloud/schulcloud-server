import { Injectable } from '@nestjs/common';
import { ContextExternalToolDO, EntityId, Permission } from '@shared/domain';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { ToolContextType } from '@src/modules/tool/interface';
import { ContextTypeMapper } from './mapper';
import { ContextExternalTool } from './dto';
import { ContextExternalToolService } from '../service';
import { ContextExternalToolValidationService } from '../service/validation/context-external-tool-validation.service';

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
