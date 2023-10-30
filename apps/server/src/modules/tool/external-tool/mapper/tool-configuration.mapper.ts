import { ContextExternalToolConfigurationTemplateListResponse } from '../controller/dto/response/context-external-tool-configuration-template-list.response';
import { ContextExternalToolConfigurationTemplateResponse } from '../controller/dto/response/context-external-tool-configuration-template.response';
import { SchoolExternalToolConfigurationTemplateListResponse } from '../controller/dto/response/school-external-tool-configuration-template-list.response';
import { SchoolExternalToolConfigurationTemplateResponse } from '../controller/dto/response/school-external-tool-configuration-template.response';
import { ExternalTool } from '../domain/external-tool.do';
import { ContextExternalToolTemplateInfo } from '../uc/dto/external-tool-configuration.types';
import { ExternalToolResponseMapper } from './external-tool-response.mapper';

export class ToolConfigurationMapper {
	static mapToSchoolExternalToolConfigurationTemplateResponse(
		externalTool: ExternalTool
	): SchoolExternalToolConfigurationTemplateResponse {
		const mapped = new SchoolExternalToolConfigurationTemplateResponse({
			externalToolId: externalTool.id ?? '',
			name: externalTool.name,
			logoUrl: externalTool.logoUrl,
			parameters: externalTool.parameters
				? ExternalToolResponseMapper.mapCustomParameterToResponse(externalTool.parameters)
				: [],
			version: externalTool.version,
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
			logoUrl: externalTool.logoUrl,
			parameters: externalTool.parameters
				? ExternalToolResponseMapper.mapCustomParameterToResponse(externalTool.parameters)
				: [],
			version: externalTool.version,
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
}
