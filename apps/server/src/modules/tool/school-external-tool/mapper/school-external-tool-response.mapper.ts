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
import { SchoolExternalToolDO } from '../domainobject';
import { CustomParameterEntryDO } from '../../common/domainobject';

export const statusMapping: Record<ToolConfigurationStatus, ToolConfigurationStatusResponse> = {
	[ToolConfigurationStatus.LATEST]: ToolConfigurationStatusResponse.LATEST,
	[ToolConfigurationStatus.OUTDATED]: ToolConfigurationStatusResponse.OUTDATED,
	[ToolConfigurationStatus.UNKNOWN]: ToolConfigurationStatusResponse.UNKNOWN,
};

@Injectable()
export class SchoolExternalToolResponseMapper {
	mapToSearchListResponse(externalToolDOS: SchoolExternalToolDO[]): SchoolExternalToolSearchListResponse {
		const responses: SchoolExternalToolResponse[] = externalToolDOS.map((toolDO: SchoolExternalToolDO) =>
			this.mapToSchoolExternalToolResponse(toolDO)
		);
		return new SchoolExternalToolSearchListResponse(responses);
	}

	mapToSchoolExternalToolResponse(schoolExternalToolDO: SchoolExternalToolDO): SchoolExternalToolResponse {
		return {
			id: schoolExternalToolDO.id ?? '',
			name: schoolExternalToolDO.name ?? '',
			toolId: schoolExternalToolDO.toolId,
			schoolId: schoolExternalToolDO.schoolId,
			parameters: this.mapToCustomParameterEntryResponse(schoolExternalToolDO.parameters),
			toolVersion: schoolExternalToolDO.toolVersion,
			status: schoolExternalToolDO.status
				? statusMapping[schoolExternalToolDO.status]
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
