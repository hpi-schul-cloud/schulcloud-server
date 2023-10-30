import { Injectable } from '@nestjs/common';
import { CustomParameterEntry } from '../../common/domain/custom-parameter-entry.do';
import { ToolStatusResponseMapper } from '../../common/mapper/tool-status-response.mapper';
import { ToolConfigurationStatusResponse } from '../../context-external-tool/controller/dto/tool-configuration-status.response';
import { CustomParameterEntryResponse } from '../controller/dto/custom-parameter-entry.response';
import { SchoolExternalToolSearchListResponse } from '../controller/dto/school-external-tool-search-list.response';
import { SchoolExternalToolResponse } from '../controller/dto/school-external-tool.response';
import { SchoolExternalTool } from '../domain/school-external-tool.do';

@Injectable()
export class SchoolExternalToolResponseMapper {
	mapToSearchListResponse(externalTools: SchoolExternalTool[]): SchoolExternalToolSearchListResponse {
		const responses: SchoolExternalToolResponse[] = externalTools.map((toolDO: SchoolExternalTool) =>
			this.mapToSchoolExternalToolResponse(toolDO)
		);
		return new SchoolExternalToolSearchListResponse(responses);
	}

	mapToSchoolExternalToolResponse(schoolExternalTool: SchoolExternalTool): SchoolExternalToolResponse {
		return {
			id: schoolExternalTool.id ?? '',
			name: schoolExternalTool.name ?? '',
			toolId: schoolExternalTool.toolId,
			schoolId: schoolExternalTool.schoolId,
			parameters: this.mapToCustomParameterEntryResponse(schoolExternalTool.parameters),
			toolVersion: schoolExternalTool.toolVersion,
			status: schoolExternalTool.status
				? ToolStatusResponseMapper.mapToResponse(schoolExternalTool.status)
				: ToolConfigurationStatusResponse.UNKNOWN,
		};
	}

	private mapToCustomParameterEntryResponse(entries: CustomParameterEntry[]): CustomParameterEntryResponse[] {
		return entries.map(
			(entry: CustomParameterEntry): CustomParameterEntry =>
				new CustomParameterEntryResponse({
					name: entry.name,
					value: entry.value,
				})
		);
	}
}
