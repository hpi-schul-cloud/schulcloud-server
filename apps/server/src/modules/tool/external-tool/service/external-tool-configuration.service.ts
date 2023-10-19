import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Page } from '@shared/domain';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ExternalTool } from '../domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { CustomParameterScope } from '../../common/enum';
import { CustomParameter } from '../../common/domain';
import { ContextExternalToolTemplateInfo } from '../uc/dto';

@Injectable()
export class ExternalToolConfigurationService {
	constructor(@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures) {}

	public filterForAvailableTools(externalTools: Page<ExternalTool>, toolIdsInUse: EntityId[]): ExternalTool[] {
		const visibleTools: ExternalTool[] = externalTools.data.filter((tool: ExternalTool): boolean => !tool.isHidden);

		const availableTools: ExternalTool[] = visibleTools.filter(
			(tool: ExternalTool): boolean => !!tool.id && !toolIdsInUse.includes(tool.id)
		);
		return availableTools;
	}

	public filterForAvailableSchoolExternalTools(
		schoolExternalTools: SchoolExternalTool[],
		contextExternalToolsInUse: ContextExternalTool[]
	): SchoolExternalTool[] {
		const availableSchoolExternalTools: SchoolExternalTool[] = schoolExternalTools.filter(
			(schoolExternalTool: SchoolExternalTool): boolean => {
				if (this.toolFeatures.contextConfigurationEnabled) {
					return true;
				}

				const hasContextExternalTool: boolean = contextExternalToolsInUse.some(
					(contextExternalTool: ContextExternalTool) =>
						contextExternalTool.schoolToolRef.schoolToolId === schoolExternalTool.id
				);

				return !hasContextExternalTool;
			}
		);

		return availableSchoolExternalTools;
	}

	public filterForAvailableExternalTools(
		externalTools: ExternalTool[],
		availableSchoolExternalTools: SchoolExternalTool[]
	): ContextExternalToolTemplateInfo[] {
		const toolsWithSchoolTool: (ContextExternalToolTemplateInfo | null)[] = availableSchoolExternalTools.map(
			(schoolExternalTool: SchoolExternalTool) => {
				const externalTool: ExternalTool | undefined = externalTools.find(
					(tool: ExternalTool) => schoolExternalTool.toolId === tool.id
				);

				if (!externalTool) {
					return null;
				}

				return {
					externalTool,
					schoolExternalTool,
				};
			}
		);

		const unusedTools: ContextExternalToolTemplateInfo[] = toolsWithSchoolTool.filter(
			(toolRef): toolRef is ContextExternalToolTemplateInfo => !!toolRef
		);
		const availableTools: ContextExternalToolTemplateInfo[] = unusedTools.filter(
			(toolRef): toolRef is ContextExternalToolTemplateInfo => !toolRef.externalTool.isHidden
		);

		return availableTools;
	}

	public filterParametersForScope(externalTool: ExternalTool, scope: CustomParameterScope) {
		if (externalTool.parameters) {
			externalTool.parameters = externalTool.parameters.filter(
				(parameter: CustomParameter) => parameter.scope === scope
			);
		}
	}
}
