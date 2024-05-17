import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ToolContextType } from '../../common/enum';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ContextExternalTool, ContextRef, ToolReference } from '../domain';
import { ContextExternalToolService, ToolReferenceService } from '../service';

@Injectable()
export class ToolReferenceUc {
	constructor(
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly toolReferenceService: ToolReferenceService,
		private readonly toolPermissionHelper: ToolPermissionHelper,
		private readonly authorizationService: AuthorizationService
	) {}

	async getToolReferencesForContext(
		userId: EntityId,
		contextType: ToolContextType,
		contextId: EntityId
	): Promise<ToolReference[]> {
		const contextRef = new ContextRef({ type: contextType, id: contextId });

		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolService.findAllByContext(
			contextRef
		);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const toolReferencesPromises: Promise<ToolReference | null>[] = contextExternalTools.map(
			async (contextExternalTool: ContextExternalTool) => this.tryBuildToolReference(user, contextExternalTool)
		);

		const toolReferencesWithNull: (ToolReference | null)[] = await Promise.all(toolReferencesPromises);
		const filteredToolReferences: ToolReference[] = toolReferencesWithNull.filter(
			(toolReference: ToolReference | null): toolReference is ToolReference => toolReference !== null
		);

		return filteredToolReferences;
	}

	private async tryBuildToolReference(
		user: User,
		contextExternalTool: ContextExternalTool
	): Promise<ToolReference | null> {
		try {
			await this.ensureToolPermissions(user, contextExternalTool);

			const toolReference: ToolReference = await this.toolReferenceService.getToolReference(contextExternalTool.id);

			return toolReference;
		} catch (e: unknown) {
			return null;
		}
	}

	async getToolReference(userId: EntityId, contextExternalToolId: EntityId): Promise<ToolReference> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.findByIdOrFail(
			contextExternalToolId
		);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		await this.ensureToolPermissions(user, contextExternalTool);

		const toolReference: ToolReference = await this.toolReferenceService.getToolReference(contextExternalTool.id);

		return toolReference;
	}

	private async ensureToolPermissions(user: User, contextExternalTool: ContextExternalTool): Promise<void> {
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

		const promise: Promise<void> = this.toolPermissionHelper.ensureContextPermissions(
			user,
			contextExternalTool,
			context
		);

		return promise;
	}
}
