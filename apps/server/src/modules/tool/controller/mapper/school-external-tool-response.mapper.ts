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
	ToolConfigurationStatusResponse,
} from '../dto';

const statusMapping: Record<SchoolExternalToolStatus, ToolConfigurationStatusResponse> = {
	[SchoolExternalToolStatus.LATEST]: ToolConfigurationStatusResponse.LATEST,
	[SchoolExternalToolStatus.OUTDATED]: ToolConfigurationStatusResponse.OUTDATED,
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
