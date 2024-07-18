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
}
