import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ToolContextType } from '../../common/enum';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { type ContextExternalTool, ContextExternalToolLaunchable } from '../../context-external-tool/domain';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { type SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { LaunchContextUnavailableLoggableException } from '../error';
import { ToolLaunchService } from '../service';
import { ToolLaunchData, ToolLaunchRequest } from '../types';

@Injectable()
export class ToolLaunchUc {
	constructor(
		private readonly toolLaunchService: ToolLaunchService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly toolPermissionHelper: ToolPermissionHelper,
		private readonly authorizationService: AuthorizationService
	) {}

	async getContextExternalToolLaunchRequest(
		userId: EntityId,
		contextExternalToolId: EntityId
	): Promise<ToolLaunchRequest> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.findByIdOrFail(
			contextExternalToolId
		);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);
		await this.toolPermissionHelper.ensureContextPermissions(user, contextExternalTool, context);

		const toolLaunchData: ToolLaunchData = await this.toolLaunchService.getLaunchData(userId, contextExternalTool);
		const launchRequest: ToolLaunchRequest = this.toolLaunchService.generateLaunchRequest(toolLaunchData);

		return launchRequest;
	}

	async getSchoolExternalToolLaunchRequest(
		userId: EntityId,
		pseudoContextExternalTool: ContextExternalToolLaunchable
	): Promise<ToolLaunchRequest> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(
			pseudoContextExternalTool.schoolToolRef.schoolToolId
		);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);
		await this.toolPermissionHelper.ensureContextPermissionsForSchool(
			user,
			schoolExternalTool,
			pseudoContextExternalTool.contextRef.id,
			pseudoContextExternalTool.contextRef.type,
			context
		);

		const availableLaunchContexts: ToolContextType[] = [ToolContextType.MEDIA_BOARD];
		if (!availableLaunchContexts.includes(pseudoContextExternalTool.contextRef.type)) {
			throw new LaunchContextUnavailableLoggableException(pseudoContextExternalTool, userId);
		}

		await this.contextExternalToolService.checkContextRestrictions(pseudoContextExternalTool);

		const toolLaunchData: ToolLaunchData = await this.toolLaunchService.getLaunchData(
			userId,
			pseudoContextExternalTool
		);
		const launchRequest: ToolLaunchRequest = this.toolLaunchService.generateLaunchRequest(toolLaunchData);

		return launchRequest;
	}
}
