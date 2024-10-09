import { PreferedToolListResponse } from '@modules/tool/external-tool/controller/dto/response/prefered-tool-list.response';
import { PreferedToolResponse } from '@modules/tool/external-tool/controller/dto/response/prefered-tool.response';
import { ToolContextType } from '../../common/enum';
import {
	ContextExternalToolConfigurationTemplateListResponse,
	ContextExternalToolConfigurationTemplateResponse,
	SchoolExternalToolConfigurationTemplateListResponse,
	SchoolExternalToolConfigurationTemplateResponse,
	ToolContextTypesListResponse,
} from '../controller/dto';
import { ExternalTool } from '../domain';
import { ContextExternalToolTemplateInfo } from '../uc';
import { ExternalToolResponseMapper } from './external-tool-response.mapper';

export class ToolConfigurationMapper {
	static mapToSchoolExternalToolConfigurationTemplateResponse(
		externalTool: ExternalTool
	): SchoolExternalToolConfigurationTemplateResponse {
		const mapped = new SchoolExternalToolConfigurationTemplateResponse({
			externalToolId: externalTool.id,
			name: externalTool.name,
			baseUrl: externalTool.config.baseUrl,
			logoUrl: externalTool.logoUrl,
			parameters: externalTool.parameters
				? ExternalToolResponseMapper.mapCustomParameterToResponse(externalTool.parameters)
				: [],
		});

		return mapped;
	}

	static mapToSchoolExternalToolConfigurationTemplateListResponse(
		externalTools: ExternalTool[]
	): SchoolExternalToolConfigurationTemplateListResponse {
		const mappedTools = externalTools.map(
			(tool): SchoolExternalToolConfigurationTemplateResponse =>
				this.mapToSchoolExternalToolConfigurationTemplateResponse(tool)
		);

		const mapped = new SchoolExternalToolConfigurationTemplateListResponse(mappedTools);

		return mapped;
	}

	static mapToContextExternalToolConfigurationTemplateResponse(
		toolInfo: ContextExternalToolTemplateInfo
	): ContextExternalToolConfigurationTemplateResponse {
		const { externalTool, schoolExternalTool } = toolInfo;

		const mapped = new ContextExternalToolConfigurationTemplateResponse({
			externalToolId: externalTool.id ?? '',
			schoolExternalToolId: schoolExternalTool.id ?? '',
			name: externalTool.name,
			baseUrl: externalTool.config.baseUrl,
			logoUrl: externalTool.logoUrl,
			parameters: externalTool.parameters
				? ExternalToolResponseMapper.mapCustomParameterToResponse(externalTool.parameters)
				: [],
		});

		return mapped;
	}

	static mapToContextExternalToolConfigurationTemplateListResponse(
		toolInfos: ContextExternalToolTemplateInfo[]
	): ContextExternalToolConfigurationTemplateListResponse {
		const mappedTools = toolInfos.map(
			(tool): ContextExternalToolConfigurationTemplateResponse =>
				this.mapToContextExternalToolConfigurationTemplateResponse(tool)
		);

		const mapped = new ContextExternalToolConfigurationTemplateListResponse(mappedTools);

		return mapped;
	}

	static mapToToolContextTypesListResponse(toolContextTypes: ToolContextType[]): ToolContextTypesListResponse {
		const mappedTypes = new ToolContextTypesListResponse(toolContextTypes);

		return mappedTypes;
	}

	static mapToPreferedToolListResponse(preferedTools: ContextExternalToolTemplateInfo[]): PreferedToolListResponse {
		const mappedTools = preferedTools.map((tool): PreferedToolResponse => this.mapToPreferedToolResponse(tool));

		const mapped = new PreferedToolListResponse(mappedTools);

		return mapped;
	}

	static mapToPreferedToolResponse(preferedTool: ContextExternalToolTemplateInfo): PreferedToolResponse {
		const { externalTool, schoolExternalTool } = preferedTool;

		const mapped = new PreferedToolResponse({
			schoolExternalToolId: schoolExternalTool.id ?? '',
			name: externalTool.name,
			iconName: externalTool.iconName,
		});

		return mapped;
	}
}
