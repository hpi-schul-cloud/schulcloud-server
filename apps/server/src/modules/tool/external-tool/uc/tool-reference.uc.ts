import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { Action } from '@src/modules/authorization';
import { ToolConfigurationStatus, ToolContextType } from '../../common/enum';
import { CommonToolService } from '../../common/service';
import { ContextExternalTool, ContextRef } from '../../context-external-tool/domain';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ExternalTool, ToolReference } from '../domain';
import { ToolReferenceMapper } from '../mapper/tool-reference.mapper';
import { ExternalToolService } from '../service';

@Injectable()
export class ToolReferenceUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly commonToolService: CommonToolService
	) {}

	async getToolReferences(userId: EntityId, contextType: ToolContextType, contextId: string): Promise<ToolReference[]> {
		const contextRef = new ContextRef({ type: contextType, id: contextId });

		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolService.findAllByContext(
			contextRef
		);

		const toolReferencesPromises: Promise<ToolReference | null>[] = contextExternalTools.map(
			(contextExternalTool: ContextExternalTool) => this.buildToolReference(userId, contextExternalTool)
		);

		const toolReferencesWithNull: (ToolReference | null)[] = await Promise.all(toolReferencesPromises);
		const filteredToolReferences: ToolReference[] = toolReferencesWithNull.filter(
			(toolReference: ToolReference | null): toolReference is ToolReference => toolReference !== null
		);

		return filteredToolReferences;
	}

	private async buildToolReference(
		userId: EntityId,
		contextExternalTool: ContextExternalTool
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
		toolReference.logoUrl = this.buildLogoUrl(externalTool);

		return toolReference;
	}

	private buildLogoUrl(externalTool: ExternalTool): string {
		const { logo, id } = externalTool;
		const backendUrl = Configuration.get('PUBLIC_BACKEND_URL') as string;

		if (logo) {
			return `${backendUrl}/v3/tools/external-tools/${id ?? ''}/logo`;
		}
		return '';
	}

	private async ensureToolPermissions(userId: EntityId, contextExternalTool: ContextExternalTool): Promise<void> {
		const promise: Promise<void> = this.contextExternalToolService.ensureContextPermissions(
			userId,
			contextExternalTool,
			{
				requiredPermissions: [Permission.CONTEXT_TOOL_USER],
				action: Action.read,
			}
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
