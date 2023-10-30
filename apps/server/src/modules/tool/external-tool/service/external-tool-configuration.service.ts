import { Inject, Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject/page';
import { EntityId } from '@shared/domain/types/entity-id';
import { CustomParameter } from '../../common/domain/custom-parameter.do';
import { CustomParameterScope } from '../../common/enum/custom-parameter-scope.enum';
import { ContextExternalTool } from '../../context-external-tool/domain/context-external-tool.do';
import { SchoolExternalTool } from '../../school-external-tool/domain/school-external-tool.do';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ExternalTool } from '../domain/external-tool.do';
import { ContextExternalToolTemplateInfo } from '../uc/dto/external-tool-configuration.types';

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
