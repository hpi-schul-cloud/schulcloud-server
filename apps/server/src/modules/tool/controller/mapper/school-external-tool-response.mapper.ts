import { Injectable } from '@nestjs/common';
import {
	SchoolExternalToolDO,
	CustomParameterEntryDO,
	CustomParameterEntry,
	SchoolExternalToolStatus,
} from '@shared/domain';
import {
	SchoolExternalToolSearchListResponse,
	SchoolExternalToolResponse,
	CustomParameterEntryResponse,
	SchoolExternalToolStatusResponse,
	SchoolToolConfigurationListResponse,
	SchoolToolConfigurationEntryResponse,
} from '../dto';
import { AvailableToolsForContext } from '../../uc/dto/external-tool-configuration.types';

const statusMapping: Record<SchoolExternalToolStatus, SchoolExternalToolStatusResponse> = {
	[SchoolExternalToolStatus.LATEST]: SchoolExternalToolStatusResponse.LATEST,
	[SchoolExternalToolStatus.OUTDATED]: SchoolExternalToolStatusResponse.OUTDATED,
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
				: SchoolExternalToolStatusResponse.UNKNOWN,
		};
	}

	mapExternalToolDOsToSchoolToolConfigurationListResponse(
		availableToolsForContext: AvailableToolsForContext[]
	): SchoolToolConfigurationListResponse {
		return new SchoolToolConfigurationListResponse(
			this.mapExternalToolDOsToSchoolToolConfigurationResponses(availableToolsForContext)
		);
	}

	private mapExternalToolDOsToSchoolToolConfigurationResponses(
		availableToolsForContext: AvailableToolsForContext[]
	): SchoolToolConfigurationEntryResponse[] {
		return availableToolsForContext.map(
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
