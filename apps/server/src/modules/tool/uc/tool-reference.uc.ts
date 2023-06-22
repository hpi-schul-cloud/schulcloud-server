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
import {
	CommonToolService,
	ContextExternalToolService,
	ExternalToolService,
	SchoolExternalToolService,
} from '../service';
import { ToolContextType } from '../interface';

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

		const toolReference: ToolReference = this.createToolReference(externalTool, contextExternalTool, status);

		return toolReference;
	}

	private async ensureToolPermissions(userId: EntityId, contextExternalTool: ContextExternalToolDO): Promise<void> {
		return this.contextExternalToolService.ensureContextPermissions(userId, contextExternalTool, {
			requiredPermissions: [Permission.CONTEXT_TOOL_USER],
			action: Action.read,
		});
	}

	private async fetchSchoolExternalTool(contextExternalTool: ContextExternalToolDO): Promise<SchoolExternalToolDO> {
		return this.schoolExternalToolService.getSchoolExternalToolById(contextExternalTool.schoolToolRef.schoolToolId);
	}

	private async fetchExternalTool(schoolExternalTool: SchoolExternalToolDO): Promise<ExternalToolDO> {
		return this.externalToolService.findExternalToolById(schoolExternalTool.toolId);
	}

	private createToolReference(
		externalTool: ExternalToolDO,
		contextExternalTool: ContextExternalToolDO,
		status: ToolConfigurationStatus
	): ToolReference {
		const toolReference = new ToolReference({
			contextToolId: contextExternalTool.id as string,
			logoUrl: externalTool.logoUrl,
			displayName: contextExternalTool.displayName ?? externalTool.name,
			status,
			openInNewTab: externalTool.openNewTab,
		});

		return toolReference;
	}
}
