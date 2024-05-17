import { Injectable } from '@nestjs/common';
import { CustomParameterEntry } from '../../common/domain';
import {
	CustomParameterEntryResponse,
	SchoolExternalToolResponse,
	SchoolExternalToolSearchListResponse,
} from '../controller/dto';
import { SchoolExternalTool } from '../domain';
import { SchoolToolConfigurationStatusResponseMapper } from './school-external-tool-status-response.mapper';

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
			status: SchoolToolConfigurationStatusResponseMapper.mapToResponse(
				schoolExternalTool.status ?? { isOutdatedOnScopeSchool: false, isDeactivated: false }
			),
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
