import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { AuthorizableReferenceType, AuthorizationContext, AuthorizationService } from '@src/modules';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextTypeMapper } from '../mapper';

@Injectable()
export class ToolPermissionHelper {
	constructor(private readonly authorizationService: AuthorizationService) {}

	public async ensureContextPermissions(
		userId: EntityId,
		contextExternalTool: ContextExternalTool,
		context: AuthorizationContext
	): Promise<void> {
		if (contextExternalTool.id) {
			await this.authorizationService.checkPermissionByReferences(
				userId,
				AuthorizableReferenceType.ContextExternalToolEntity,
				contextExternalTool.id,
				context
			);
		}

		await this.authorizationService.checkPermissionByReferences(
			userId,
			ContextTypeMapper.mapContextTypeToAllowedAuthorizationEntityType(contextExternalTool.contextRef.type),
			contextExternalTool.contextRef.id,
			context
		);
	}
}
