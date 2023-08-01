import { ForbiddenException, Injectable } from '@nestjs/common';
import { ToolReference } from '@shared/domain/domainobject/tool/tool-reference';
import {
	ContextExternalToolDO,
	ContextRef,
	EntityId,
	ExternalToolDO,
	Permission,
	SchoolExternalToolDO,
	ToolConfigurationStatus,
} from '@shared/domain';
import { Action } from '@src/modules/authorization';
import { ToolContextType } from '../../common/interface';
import { ExternalToolService } from '../service';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { CommonToolService } from '../../common/service';
import { ToolReferenceMapper } from '../mapper/tool-reference.mapper';

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

		const contextExternalTools: ContextExternalToolDO[] = await this.contextExternalToolService.findAllByContext(
			contextRef
		);

		const toolReferencesPromises: Promise<ToolReference | null>[] = contextExternalTools.map(
			(contextExternalTool: ContextExternalToolDO) => this.buildToolReference(userId, contextExternalTool)
		);

		const toolReferencesWithNull: (ToolReference | null)[] = await Promise.all(toolReferencesPromises);
		const filteredToolReferences: ToolReference[] = toolReferencesWithNull.filter(
			(toolReference: ToolReference | null): toolReference is ToolReference => toolReference !== null
		);

		return filteredToolReferences;
	}

	private async buildToolReference(
		userId: EntityId,
		contextExternalTool: ContextExternalToolDO
	): Promise<ToolReference | null> {
		try {
			await this.ensureToolPermissions(userId, contextExternalTool);
		} catch (e: unknown) {
			if (e instanceof ForbiddenException) {
				return null;
			}
		}

		const schoolExternalTool: SchoolExternalToolDO = await this.fetchSchoolExternalTool(contextExternalTool);
		const externalTool: ExternalToolDO = await this.fetchExternalTool(schoolExternalTool);

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

		return toolReference;
	}

	private async ensureToolPermissions(userId: EntityId, contextExternalTool: ContextExternalToolDO): Promise<void> {
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

	private async fetchSchoolExternalTool(contextExternalTool: ContextExternalToolDO): Promise<SchoolExternalToolDO> {
		return this.schoolExternalToolService.getSchoolExternalToolById(contextExternalTool.schoolToolRef.schoolToolId);
	}

	private async fetchExternalTool(schoolExternalTool: SchoolExternalToolDO): Promise<ExternalToolDO> {
		return this.externalToolService.findExternalToolById(schoolExternalTool.toolId);
	}
}
