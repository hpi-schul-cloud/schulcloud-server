import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { AuthorizationContext, AuthorizationContextBuilder } from '@src/modules/authorization';
import { ExternalTool, ToolReference } from '../domain';
import { ToolConfigurationStatus, ToolContextType } from '../../common/enum';
import { CommonToolService } from '../../common/service';
import { ContextExternalTool, ContextRef } from '../../context-external-tool/domain';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ToolReferenceMapper } from '../mapper/tool-reference.mapper';
import { ExternalToolLogoService, ExternalToolService } from '../service';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';

@Injectable()
export class ToolReferenceUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly toolPermissionHelper: ToolPermissionHelper,
		private readonly commonToolService: CommonToolService,
		private readonly externalToolLogoService: ExternalToolLogoService
	) {}

	async getToolReferences(
		userId: EntityId,
		contextType: ToolContextType,
		contextId: string,
		logoUrlTemplate: string
	): Promise<ToolReference[]> {
		const contextRef = new ContextRef({ type: contextType, id: contextId });

		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolService.findAllByContext(
			contextRef
		);

		const toolReferencesPromises: Promise<ToolReference | null>[] = contextExternalTools.map(
			(contextExternalTool: ContextExternalTool) =>
				this.buildToolReference(userId, contextExternalTool, logoUrlTemplate)
		);

		const toolReferencesWithNull: (ToolReference | null)[] = await Promise.all(toolReferencesPromises);
		const filteredToolReferences: ToolReference[] = toolReferencesWithNull.filter(
			(toolReference: ToolReference | null): toolReference is ToolReference => toolReference !== null
		);

		return filteredToolReferences;
	}

	private async buildToolReference(
		userId: EntityId,
		contextExternalTool: ContextExternalTool,
		logoUrlTemplate: string
	): Promise<ToolReference | null> {
		try {
			await this.ensureToolPermissions(userId, contextExternalTool);
		} catch (e: unknown) {
			if (e instanceof ForbiddenException) {
				return null;
			}
		}

		const schoolExternalTool: SchoolExternalTool = await this.fetchSchoolExternalTool(contextExternalTool);
		const externalTool: ExternalTool = await this.fetchExternalTool(schoolExternalTool);

		const status: ToolConfigurationStatus = this.commonToolService.determineToolConfigurationStatus(
			externalTool,
			schoolExternalTool,
			contextExternalTool
		);

		const toolReference: ToolReference = ToolReferenceMapper.mapToToolReference(
			externalTool,
			contextExternalTool,
			status
		);
		toolReference.logoUrl = this.externalToolLogoService.buildLogoUrl(logoUrlTemplate, externalTool);

		return toolReference;
	}

	private async ensureToolPermissions(userId: EntityId, contextExternalTool: ContextExternalTool): Promise<void> {
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

		const promise: Promise<void> = this.toolPermissionHelper.ensureContextPermissions(
			userId,
			contextExternalTool,
			context
		);

		return promise;
	}

	private async fetchSchoolExternalTool(contextExternalTool: ContextExternalTool): Promise<SchoolExternalTool> {
		return this.schoolExternalToolService.getSchoolExternalToolById(contextExternalTool.schoolToolRef.schoolToolId);
	}

	private async fetchExternalTool(schoolExternalTool: SchoolExternalTool): Promise<ExternalTool> {
		return this.externalToolService.findExternalToolById(schoolExternalTool.toolId);
	}
}
