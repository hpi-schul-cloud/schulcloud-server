import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { MissingLicenceLoggableException } from '@modules/tool/tool-launch/error/missing-licence.loggable-exception';
import { MediaUserLicense, UserLicenseService } from '@modules/user-license';
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
		private readonly authorizationService: AuthorizationService,
		private readonly userLicenceService: UserLicenseService
	) {}

	async getToolLaunchRequest(userId: EntityId, contextExternalToolId: EntityId): Promise<ToolLaunchRequest> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.findByIdOrFail(
			contextExternalToolId
		);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);
		const user: User = await this.authorizationService.getUserWithPermissions(userId);

		await this.toolPermissionHelper.ensureContextPermissions(user, contextExternalTool, context);

		// TODO: N21-1881 use configService?
		if (Configuration.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')) {
			await this.checkLicenseForExternal(contextExternalTool, userId);
		}

		const toolLaunchData: ToolLaunchData = await this.toolLaunchService.getLaunchData(userId, contextExternalTool);
		const launchRequest: ToolLaunchRequest = this.toolLaunchService.generateLaunchRequest(toolLaunchData);

		return launchRequest;
	}

	private async checkLicenseForExternal(contextExternalTool: ContextExternalTool, userId: EntityId) {
		const schoolExternalToolId: EntityId = contextExternalTool.schoolToolRef.schoolToolId;

		const { externalTool } = await this.toolLaunchService.loadToolHierarchy(schoolExternalToolId);

		const mediaUserLicenses: MediaUserLicense[] = await this.userLicenceService.getMediaUserLicensesForUser(userId);

		if (
			externalTool.medium?.mediumId &&
			!this.userLicenceService.hasLicenceForExternalTool(externalTool.medium.mediumId, mediaUserLicenses)
		) {
			throw new MissingLicenceLoggableException(externalTool.medium, userId, contextExternalTool.id);
		}
	}
}
