import { Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { Action } from '@src/modules/authorization';
import { ForbiddenLoggableException } from '@src/modules/authorization/errors/forbidden.loggable-exception';
import { ToolContextType } from '../../common/enum';
import { ContextExternalTool, ContextRef } from '../domain';
import { ContextExternalToolService, ContextExternalToolValidationService } from '../service';
import { ContextExternalToolDto } from './dto/context-external-tool.types';
import { ExternalToolLogoService, ExternalToolService } from '../../external-tool/service';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalToolComposite } from './dto/context-external-tool-composite';

@Injectable()
export class ContextExternalToolUc {
	constructor(
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly contextExternalToolValidationService: ContextExternalToolValidationService,
		private readonly logger: LegacyLogger,
		private readonly externalToolLogoService: ExternalToolLogoService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly externalToolService: ExternalToolService
	) {}

	async createContextExternalTool(
		userId: EntityId,
		contextExternalToolDto: ContextExternalToolDto
	): Promise<ContextExternalTool> {
		const contextExternalTool = new ContextExternalTool(contextExternalToolDto);

		await this.contextExternalToolService.ensureContextPermissions(userId, contextExternalTool, {
			requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			action: Action.write,
		});

		await this.contextExternalToolValidationService.validate(contextExternalToolDto);

		const createdTool: ContextExternalTool = await this.contextExternalToolService.saveContextExternalTool(
			contextExternalTool
		);

		return createdTool;
	}

	async updateContextExternalTool(
		userId: EntityId,
		contextExternalToolId: EntityId,
		contextExternalToolDto: ContextExternalToolDto
	): Promise<ContextExternalTool> {
		const contextExternalTool: ContextExternalTool = new ContextExternalTool(contextExternalToolDto);

		await this.contextExternalToolService.ensureContextPermissions(userId, contextExternalTool, {
			requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			action: Action.write,
		});

		const updated: ContextExternalTool = new ContextExternalTool({
			...contextExternalTool,
			id: contextExternalToolId,
		});

		await this.contextExternalToolValidationService.validate(updated);

		const saved: ContextExternalTool = await this.contextExternalToolService.saveContextExternalTool(updated);

		return saved;
	}

	async deleteContextExternalTool(userId: EntityId, contextExternalToolId: EntityId): Promise<void> {
		const tool: ContextExternalTool = await this.contextExternalToolService.getContextExternalToolById(
			contextExternalToolId
		);

		await this.contextExternalToolService.ensureContextPermissions(userId, tool, {
			requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			action: Action.write,
		});

		const promise: Promise<void> = this.contextExternalToolService.deleteContextExternalTool(tool);

		return promise;
	}

	async getContextExternalToolsForContext(
		userId: EntityId,
		contextType: ToolContextType,
		contextId: string,
		logoUrlTemplate: string
	) {
		const tools: ContextExternalTool[] = await this.contextExternalToolService.findAllByContext(
			new ContextRef({ id: contextId, type: contextType })
		);

		const toolsWithPermission: ContextExternalTool[] = await this.filterToolsWithPermissions(userId, tools);

		const toolsWithPermissionComposite = await this.addLogoUrlsToTools(logoUrlTemplate, toolsWithPermission);

		return toolsWithPermissionComposite;
	}

	async getContextExternalTool(userId: EntityId, contextToolId: EntityId) {
		const tool: ContextExternalTool = await this.contextExternalToolService.getContextExternalToolById(contextToolId);

		await this.contextExternalToolService.ensureContextPermissions(userId, tool, {
			requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			action: Action.read,
		});

		return tool;
	}

	private async filterToolsWithPermissions(
		userId: EntityId,
		tools: ContextExternalTool[]
	): Promise<ContextExternalTool[]> {
		const toolPromises = tools.map(async (tool) => {
			try {
				await this.contextExternalToolService.ensureContextPermissions(userId, tool, {
					requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
					action: Action.read,
				});

				return tool;
			} catch (error) {
				if (error instanceof ForbiddenLoggableException) {
					this.logger.debug(`User ${userId} does not have permission for tool ${tool.id ?? 'undefined'}`);
					return null;
				}
				throw error;
			}
		});

		const toolsWithPermission = await Promise.all(toolPromises);
		const filteredTools: ContextExternalTool[] = toolsWithPermission.filter(
			(tool) => tool !== null
		) as ContextExternalTool[];
		return filteredTools;
	}

	private async fetchSchoolExternalTool(contextExternalTool: ContextExternalTool): Promise<SchoolExternalTool> {
		return this.schoolExternalToolService.getSchoolExternalToolById(contextExternalTool.schoolToolRef.schoolToolId);
	}

	private async fetchExternalTool(schoolExternalTool: SchoolExternalTool): Promise<ExternalTool> {
		return this.externalToolService.findExternalToolById(schoolExternalTool.toolId);
	}

	private async addLogoUrlsToTools(
		logoUrlTemplate: string,
		tools: ContextExternalTool[]
	): Promise<ContextExternalToolComposite[]> {
		const toolsWithPermissionComposite = await Promise.all(
			tools.map(async (contextExternalTool): Promise<ContextExternalToolComposite> => {
				const schoolExternalTool: SchoolExternalTool = await this.fetchSchoolExternalTool(contextExternalTool);
				const tool: ExternalTool = await this.fetchExternalTool(schoolExternalTool);

				const contextExternalToolComposite: ContextExternalToolComposite = new ContextExternalToolComposite(
					contextExternalTool
				);

				contextExternalToolComposite.logoUrl = this.externalToolLogoService.buildLogoUrl(logoUrlTemplate, tool);
				return contextExternalToolComposite;
			})
		);
		return toolsWithPermissionComposite;
	}
}
