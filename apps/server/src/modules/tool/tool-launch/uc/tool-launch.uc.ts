import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { ToolLaunchService } from '../service';
import { ToolLaunchData, ToolLaunchRequest } from '../types';

@Injectable()
export class ToolLaunchUc {
	constructor(
		private readonly toolLaunchService: ToolLaunchService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly toolPermissionHelper: ToolPermissionHelper,
		private readonly authorizationService: AuthorizationService
	) {}

	async getToolLaunchRequest(userId: EntityId, contextExternalToolId: EntityId): Promise<ToolLaunchRequest> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.findByIdOrFail(
			contextExternalToolId
		);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);
		const user: User = await this.authorizationService.getUserWithPermissions(userId);

		await this.toolPermissionHelper.ensureContextPermissions(user, contextExternalTool, context);

		// TODO: N21-1881 use configService? change to correct flag
		if (Configuration.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			await this.checkLicenseForExternal(contextExternalTool, user);
		}

		const toolLaunchData: ToolLaunchData = await this.toolLaunchService.getLaunchData(userId, contextExternalTool);
		const launchRequest: ToolLaunchRequest = this.toolLaunchService.generateLaunchRequest(toolLaunchData);

		return launchRequest;
	}

	private async checkLicenseForExternal(contextExternalTool: ContextExternalTool, user: User) {
		const schoolExternalToolId: EntityId = contextExternalTool.schoolToolRef.schoolToolId;

		const { externalTool } = await this.toolLaunchService.loadToolHierarchy(schoolExternalToolId);

		if (!this.licenceService.checkLicenceForExternalTool(externalTool, user)) {
			throw new Loggable();
		}
	}
}
