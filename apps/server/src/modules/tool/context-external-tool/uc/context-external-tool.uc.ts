import {
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationService,
	ForbiddenLoggableException,
} from '@modules/authorization';
import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ToolContextType } from '../../common/enum';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalTool, ContextRef } from '../domain';
import { ContextExternalToolService } from '../service';
import { ContextExternalToolValidationService } from '../service/context-external-tool-validation.service';
import { ContextExternalToolDto } from './dto/context-external-tool.types';

@Injectable()
export class ContextExternalToolUc {
	constructor(
		private readonly toolPermissionHelper: ToolPermissionHelper,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly contextExternalToolValidationService: ContextExternalToolValidationService,
		private readonly authorizationService: AuthorizationService
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
}
