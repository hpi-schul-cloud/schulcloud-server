import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ProvisioningConfig } from '@modules/provisioning';
import { MissingMediaLicenseLoggableException } from '@modules/tool/tool-launch/error';
import { MediaUserLicense, UserLicenseService } from '@modules/user-license';
import { MediaUserLicenseService } from '@modules/user-license/service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
		private readonly authorizationService: AuthorizationService,
		private readonly userLicenseService: UserLicenseService,
		private readonly mediaUserLicenseService: MediaUserLicenseService,
		private readonly configService: ConfigService<ProvisioningConfig, true>
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

		if (this.configService.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')) {
			await this.checkUserHasLicenseForExternalTool(contextExternalTool, userId);
		}

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

		if (this.configService.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')) {
			await this.checkUserHasLicenseForExternalTool(pseudoContextExternalTool, userId);
		}

		const toolLaunchData: ToolLaunchData = await this.toolLaunchService.getLaunchData(
			userId,
			pseudoContextExternalTool
		);
		const launchRequest: ToolLaunchRequest = this.toolLaunchService.generateLaunchRequest(toolLaunchData);

		return launchRequest;
	}

	private async checkUserHasLicenseForExternalTool(
		contextExternalTool: ContextExternalToolLaunchable,
		userId: EntityId
	): Promise<void> {
		const schoolExternalToolId: EntityId = contextExternalTool.schoolToolRef.schoolToolId;

		const { externalTool } = await this.toolLaunchService.loadToolHierarchy(schoolExternalToolId);

		const mediaUserLicenses: MediaUserLicense[] = await this.userLicenseService.getMediaUserLicensesForUser(userId);

		if (
			externalTool.medium &&
			!this.mediaUserLicenseService.hasLicenseForExternalTool(externalTool.medium, mediaUserLicenses)
		) {
			throw new MissingMediaLicenseLoggableException(externalTool.medium, userId, contextExternalTool);
		}
	}
}
