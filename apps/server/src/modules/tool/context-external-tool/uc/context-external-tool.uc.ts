import {
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationService,
	ForbiddenLoggableException,
} from '@modules/authorization';
import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Authorization } from 'oauth-1.0a';
import { ToolContextType } from '../../common/enum';
import { Lti11EncryptionService } from '../../common/service';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ExternalToolService } from '../../external-tool';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalTool, ContextRef, LtiDeepLink, LtiDeepLinkToken } from '../domain';
import { LtiDeepLinkTokenMissingLoggableException } from '../domain/error';
import { ContextExternalToolService, LtiDeepLinkingService, LtiDeepLinkTokenService } from '../service';
import { ContextExternalToolValidationService } from '../service/context-external-tool-validation.service';
import { ContextExternalToolDto } from './dto/context-external-tool.types';

@Injectable()
export class ContextExternalToolUc {
	constructor(
		private readonly toolPermissionHelper: ToolPermissionHelper,
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly contextExternalToolValidationService: ContextExternalToolValidationService,
		private readonly authorizationService: AuthorizationService,
		private readonly ltiDeepLinkTokenService: LtiDeepLinkTokenService,
		private readonly ltiDeepLinkingService: LtiDeepLinkingService,
		private readonly lti11EncryptionService: Lti11EncryptionService
	) {}

	async createContextExternalTool(
		userId: EntityId,
		schoolId: EntityId,
		contextExternalToolDto: ContextExternalToolDto
	): Promise<ContextExternalTool> {
		const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN]);
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(
			contextExternalToolDto.schoolToolRef.schoolToolId
		);

		if (schoolExternalTool.schoolId !== schoolId) {
			throw new ForbiddenLoggableException(userId, AuthorizableReferenceType.ContextExternalToolEntity, context);
		}

		contextExternalToolDto.schoolToolRef.schoolId = schoolId;
		const contextExternalTool = new ContextExternalTool(contextExternalToolDto);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		await this.toolPermissionHelper.ensureContextPermissions(user, contextExternalTool, context);

		await this.contextExternalToolService.checkContextRestrictions(contextExternalTool);

		await this.contextExternalToolValidationService.validate(contextExternalTool);

		const createdTool: ContextExternalTool = await this.contextExternalToolService.saveContextExternalTool(
			contextExternalTool
		);

		return createdTool;
	}

	async updateContextExternalTool(
		userId: EntityId,
		schoolId: EntityId,
		contextExternalToolId: EntityId,
		contextExternalToolDto: ContextExternalToolDto
	): Promise<ContextExternalTool> {
		const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN]);
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(
			contextExternalToolDto.schoolToolRef.schoolToolId
		);

		if (schoolExternalTool.schoolId !== schoolId) {
			throw new ForbiddenLoggableException(userId, AuthorizableReferenceType.ContextExternalToolEntity, context);
		}

		let contextExternalTool: ContextExternalTool = await this.contextExternalToolService.findByIdOrFail(
			contextExternalToolId
		);

		contextExternalTool = new ContextExternalTool({
			...contextExternalToolDto,
			id: contextExternalTool.id,
		});
		contextExternalTool.schoolToolRef.schoolId = schoolId;

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		await this.toolPermissionHelper.ensureContextPermissions(user, contextExternalTool, context);

		await this.contextExternalToolValidationService.validate(contextExternalTool);

		const updatedTool: ContextExternalTool = await this.contextExternalToolService.saveContextExternalTool(
			contextExternalTool
		);

		return updatedTool;
	}

	public async deleteContextExternalTool(userId: EntityId, contextExternalToolId: EntityId): Promise<void> {
		const tool: ContextExternalTool = await this.contextExternalToolService.findByIdOrFail(contextExternalToolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const context = AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN]);
		await this.toolPermissionHelper.ensureContextPermissions(user, tool, context);

		await this.contextExternalToolService.deleteContextExternalTool(tool);
	}

	public async getContextExternalToolsForContext(
		userId: EntityId,
		contextType: ToolContextType,
		contextId: string
	): Promise<ContextExternalTool[]> {
		const tools: ContextExternalTool[] = await this.contextExternalToolService.findAllByContext(
			new ContextRef({ id: contextId, type: contextType })
		);

		const toolsWithPermission: ContextExternalTool[] = await this.filterToolsWithPermissions(userId, tools);

		return toolsWithPermission;
	}

	async getContextExternalTool(userId: EntityId, contextToolId: EntityId) {
		const tool: ContextExternalTool = await this.contextExternalToolService.findByIdOrFail(contextToolId);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN]);
		const user: User = await this.authorizationService.getUserWithPermissions(userId);

		await this.toolPermissionHelper.ensureContextPermissions(user, tool, context);

		return tool;
	}

	private async filterToolsWithPermissions(
		userId: EntityId,
		tools: ContextExternalTool[]
	): Promise<ContextExternalTool[]> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN]);

		const toolsWithPermission: ContextExternalTool[] = tools.filter((tool) =>
			this.authorizationService.hasPermission(user, tool, context)
		);

		return toolsWithPermission;
	}

	public async updateLtiDeepLink(
		contextExternalToolId: EntityId,
		payload: Authorization,
		state: string,
		deepLink?: LtiDeepLink
	): Promise<void> {
		const ltiDeepLinkToken: LtiDeepLinkToken | null = await this.ltiDeepLinkTokenService.findByState(state);

		if (!ltiDeepLinkToken) {
			throw new LtiDeepLinkTokenMissingLoggableException(state, contextExternalToolId);
		}

		if (!deepLink) {
			return;
		}

		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.findByIdOrFail(
			contextExternalToolId
		);

		await this.checkOauthSignature(contextExternalTool, payload);

		const user: User = await this.authorizationService.getUserWithPermissions(ltiDeepLinkToken.userId);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN]);

		await this.toolPermissionHelper.ensureContextPermissions(user, contextExternalTool, context);

		contextExternalTool.ltiDeepLink = new LtiDeepLink({ ...deepLink });

		await this.contextExternalToolService.saveContextExternalTool(contextExternalTool);
	}

	private async checkOauthSignature(contextExternalTool: ContextExternalTool, payload: Authorization) {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(
			contextExternalTool.schoolToolRef.schoolToolId
		);
		const externalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

		if (!ExternalTool.isLti11Config(externalTool.config)) {
			throw new UnauthorizedException('wrong tool');
		}

		const url: string = this.ltiDeepLinkingService.getCallbackUrl(contextExternalTool.id);

		const isValidSignature = this.lti11EncryptionService.verify(
			externalTool.config.key,
			externalTool.config.secret,
			url,
			payload
		);

		if (!isValidSignature) {
			throw new BadRequestException('Invalid signature');
		}
	}
}
