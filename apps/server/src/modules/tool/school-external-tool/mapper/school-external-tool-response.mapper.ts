import { Injectable } from '@nestjs/common';
import { CustomParameterEntry } from '../../common/domain';
import { ToolConfigurationStatus } from '../../common/enum';
import { ToolConfigurationStatusResponse } from '../../external-tool/controller/dto';
import {
	CustomParameterEntryResponse,
	SchoolExternalToolResponse,
	SchoolExternalToolSearchListResponse,
} from '../controller/dto';
import { SchoolExternalTool } from '../domain';

export const statusMapping: Record<ToolConfigurationStatus, ToolConfigurationStatusResponse> = {
	[ToolConfigurationStatus.LATEST]: ToolConfigurationStatusResponse.LATEST,
	[ToolConfigurationStatus.OUTDATED]: ToolConfigurationStatusResponse.OUTDATED,
	[ToolConfigurationStatus.UNKNOWN]: ToolConfigurationStatusResponse.UNKNOWN,
};

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
				? statusMapping[schoolExternalTool.status]
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
