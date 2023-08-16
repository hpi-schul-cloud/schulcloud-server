import { Injectable } from '@nestjs/common';
import { CustomParameterEntry } from '../../common/domain';
import { ToolConfigurationStatus } from '../../common/enum';
import { ToolConfigurationStatusResponse } from '../../external-tool/controller/dto';
import {
	CustomParameterEntryResponse,
	SchoolExternalToolResponse,
	SchoolExternalToolSearchListResponse,
} from '../controller/dto';
import { SchoolExternalToolComposite } from '../uc/dto/school-external-tool-composite';

export const statusMapping: Record<ToolConfigurationStatus, ToolConfigurationStatusResponse> = {
	[ToolConfigurationStatus.LATEST]: ToolConfigurationStatusResponse.LATEST,
	[ToolConfigurationStatus.OUTDATED]: ToolConfigurationStatusResponse.OUTDATED,
	[ToolConfigurationStatus.UNKNOWN]: ToolConfigurationStatusResponse.UNKNOWN,
};

@Injectable()
export class SchoolExternalToolResponseMapper {
	mapToSearchListResponse(externalTools: SchoolExternalToolComposite[]): SchoolExternalToolSearchListResponse {
		const responses: SchoolExternalToolResponse[] = externalTools.map((tool: SchoolExternalToolComposite) =>
			this.mapToSchoolExternalToolResponse(tool)
		);
		return new SchoolExternalToolSearchListResponse(responses);
	}

	mapToSchoolExternalToolResponse(schoolExternalTool: SchoolExternalToolComposite): SchoolExternalToolResponse {
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
			logoUrl: schoolExternalTool.logoUrl,
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
