import { CustomParameterEntry } from '../../common/domain';
import {
	CustomParameterEntryResponse,
	SchoolExternalToolConfigurationStatusResponse,
	SchoolExternalToolMediumResponse,
	SchoolExternalToolResponse,
	SchoolExternalToolSearchListResponse,
} from '../controller/dto';
import { SchoolExternalTool } from '../domain';

export class SchoolExternalToolResponseMapper {
	public static mapToSearchListResponse(externalTools: SchoolExternalTool[]): SchoolExternalToolSearchListResponse {
		const responses: SchoolExternalToolResponse[] = externalTools.map((toolDO: SchoolExternalTool) =>
			this.mapToSchoolExternalToolResponse(toolDO)
		);

		return new SchoolExternalToolSearchListResponse(responses);
	}

	public static mapToSchoolExternalToolResponse(schoolExternalTool: SchoolExternalTool): SchoolExternalToolResponse {
		const response: SchoolExternalToolResponse = new SchoolExternalToolResponse({
			id: schoolExternalTool.id,
			name: schoolExternalTool.name ?? '',
			toolId: schoolExternalTool.toolId,
			schoolId: schoolExternalTool.schoolId,
			isDeactivated: schoolExternalTool.isDeactivated,
			parameters: SchoolExternalToolResponseMapper.mapToCustomParameterEntryResponse(schoolExternalTool.parameters),
			status: new SchoolExternalToolConfigurationStatusResponse({
				isOutdatedOnScopeSchool: schoolExternalTool.status.isOutdatedOnScopeSchool,
				isGloballyDeactivated: schoolExternalTool.status.isGloballyDeactivated,
			}),
			restrictToContexts: schoolExternalTool.restrictToContexts,
			medium: schoolExternalTool.medium
				? new SchoolExternalToolMediumResponse({
						status: schoolExternalTool.medium.status,
						mediumId: schoolExternalTool.medium.mediumId,
						mediaSourceId: schoolExternalTool.medium.mediaSourceId,
						mediaSourceName: schoolExternalTool.medium.mediaSourceName,
						mediaSourceLicenseType: schoolExternalTool.medium.mediaSourceLicenseType,
				  })
				: undefined,
		});

		return response;
	}

	private static mapToCustomParameterEntryResponse(entries: CustomParameterEntry[]): CustomParameterEntryResponse[] {
		return entries.map(
			(entry: CustomParameterEntry): CustomParameterEntry =>
				new CustomParameterEntryResponse({
					name: entry.name,
					value: entry.value,
				})
		);
	}
}
