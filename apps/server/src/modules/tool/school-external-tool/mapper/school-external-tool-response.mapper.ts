import { Injectable } from '@nestjs/common';
import {
	CustomParameterEntryResponse,
	SchoolExternalToolResponse,
	SchoolExternalToolSearchListResponse,
	SchoolToolConfigurationEntryResponse,
	SchoolToolConfigurationListResponse,
} from '../controller/dto';
import { ToolConfigurationStatusResponse } from '../../external-tool/controller/dto';
import { AvailableToolsForContext } from '../../external-tool/uc';
import { CustomParameterEntry } from '../../common/entity';
import { ToolConfigurationStatus } from '../../common/enum';
import { SchoolExternalTool } from '../domain';
import { CustomParameterEntryDO } from '../../common/domain';

export const statusMapping: Record<ToolConfigurationStatus, ToolConfigurationStatusResponse> = {
	[ToolConfigurationStatus.LATEST]: ToolConfigurationStatusResponse.LATEST,
	[ToolConfigurationStatus.OUTDATED]: ToolConfigurationStatusResponse.OUTDATED,
	[ToolConfigurationStatus.UNKNOWN]: ToolConfigurationStatusResponse.UNKNOWN,
};

@Injectable()
export class SchoolExternalToolResponseMapper {
	mapToSearchListResponse(externalToolDOS: SchoolExternalTool[]): SchoolExternalToolSearchListResponse {
		const responses: SchoolExternalToolResponse[] = externalToolDOS.map((toolDO: SchoolExternalTool) =>
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

	static mapExternalToolDOsToSchoolToolConfigurationListResponse(
		availableToolsForContext: AvailableToolsForContext[]
	): SchoolToolConfigurationListResponse {
		return new SchoolToolConfigurationListResponse(
			this.mapExternalToolDOsToSchoolToolConfigurationResponses(availableToolsForContext)
		);
	}

	private static mapExternalToolDOsToSchoolToolConfigurationResponses(
		availableToolsForContext: AvailableToolsForContext[]
	): SchoolToolConfigurationEntryResponse[] {
		const mapped = availableToolsForContext.map(
			(tool: AvailableToolsForContext) =>
				new SchoolToolConfigurationEntryResponse(
					{
						id: tool.externalTool.id || '',
						name: tool.externalTool.name,
						logoUrl: tool.externalTool.logoUrl,
					},
					tool.schoolExternalTool.id as string
				)
		);

		return mapped;
	}

	private mapToCustomParameterEntryResponse(entries: CustomParameterEntryDO[]): CustomParameterEntryResponse[] {
		return entries.map(
			(entry: CustomParameterEntry): CustomParameterEntryDO =>
				new CustomParameterEntryResponse({
					name: entry.name,
					value: entry.value,
				})
		);
	}
}
