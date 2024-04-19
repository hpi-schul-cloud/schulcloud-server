import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { CustomParameter } from '../../common/domain';
import { CustomParameterScope, ToolContextType } from '../../common/enum';
import { CommonToolService } from '../../common/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalTool } from '../domain';
import { ContextExternalToolTemplateInfo } from '../uc/dto';

@Injectable()
export class ExternalToolConfigurationService {
	constructor(private readonly commonToolService: CommonToolService) {}

	public filterForAvailableTools(externalTools: Page<ExternalTool>, toolIdsInUse: EntityId[]): ExternalTool[] {
		const visibleTools: ExternalTool[] = externalTools.data.filter((tool: ExternalTool): boolean => !tool.isHidden);

		const availableTools: ExternalTool[] = visibleTools
			.filter((tool: ExternalTool): boolean => !!tool.id && !toolIdsInUse.includes(tool.id))
			.filter((tool) => !tool.isDeactivated);
		return availableTools;
	}

	public filterForAvailableExternalTools(
		externalTools: ExternalTool[],
		availableSchoolExternalTools: SchoolExternalTool[]
	): ContextExternalToolTemplateInfo[] {
		const toolsWithSchoolTool: (ContextExternalToolTemplateInfo | null)[] = availableSchoolExternalTools.map(
			(schoolExternalTool) => {
				const externalTool = externalTools.find((tool) => schoolExternalTool.toolId === tool.id);
				return externalTool ? { externalTool, schoolExternalTool } : null;
			}
		);

		const unusedTools: ContextExternalToolTemplateInfo[] = toolsWithSchoolTool.filter(
			(toolRef): toolRef is ContextExternalToolTemplateInfo => !!toolRef
		);
		const availableTools: ContextExternalToolTemplateInfo[] = unusedTools
			.filter((toolRef): toolRef is ContextExternalToolTemplateInfo => !toolRef.externalTool.isHidden)
			.filter((toolRef) => !toolRef.externalTool.isDeactivated)
			.filter((toolRef) => !toolRef.schoolExternalTool.status?.isDeactivated);

		return availableTools;
	}

	public filterForContextRestrictions(
		availableTools: ContextExternalToolTemplateInfo[],
		contextType: ToolContextType
	): ContextExternalToolTemplateInfo[] {
		const availableToolsForContext: ContextExternalToolTemplateInfo[] = availableTools.filter(
			(availableTool) => !this.commonToolService.isContextRestricted(availableTool.externalTool, contextType)
		);
		return availableToolsForContext;
	}

	public filterParametersForScope(externalTool: ExternalTool, scope: CustomParameterScope) {
		if (externalTool.parameters) {
			externalTool.parameters = externalTool.parameters.filter(
				(parameter: CustomParameter) => parameter.scope === scope
			);
		}
	}

	public getToolContextTypes(): ToolContextType[] {
		const toolContextTypes: ToolContextType[] = Object.values(ToolContextType);

		return toolContextTypes;
	}
}
