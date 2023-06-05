import { Injectable } from '@nestjs/common';
import {
	SchoolExternalToolDO,
	CustomParameterEntryDO,
	ExternalToolDO, CustomParameterEntry ,
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
		externalTools: ExternalToolDO[],
		schoolToolIds: string[]
	): SchoolToolConfigurationListResponse {
		return new SchoolToolConfigurationListResponse(
			this.mapExternalToolDOsToSchoolToolConfigurationResponses(externalTools, schoolToolIds)
		);
	}

	private mapExternalToolDOsToSchoolToolConfigurationResponses(
		externalTools: ExternalToolDO[],
		schoolToolIds: string[]
	): SchoolToolConfigurationEntryResponse[] {
		return externalTools.map(
			(tool: ExternalToolDO, index: number) =>
				new SchoolToolConfigurationEntryResponse(
					{
						id: tool.id || '',
						name: tool.name,
						logoUrl: tool.logoUrl,
					},
					schoolToolIds[index]
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
