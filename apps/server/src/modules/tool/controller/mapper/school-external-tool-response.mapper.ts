import { Injectable } from '@nestjs/common';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { CustomParameterEntryDO } from '@shared/domain/domainobject/external-tool/custom-parameter-entry.do';
import { CustomParameterEntry } from '@shared/domain';
import { SchoolExternalToolStatus } from '@shared/domain/domainobject/external-tool/school-external-tool-status';
import { SchoolExternalToolSearchListResponse } from '../dto/response/school-external-tool-search-list.response';
import { SchoolExternalToolResponse } from '../dto/response/school-external-tool.response';
import { CustomParameterEntryResponse } from '../dto/response/custom-parameter-entry.response';
import { SchoolExternalToolStatusResponse } from '../dto/response/school-external-tool-status.response';

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

	private mapToSchoolExternalToolResponse(schoolExternalToolDO: SchoolExternalToolDO): SchoolExternalToolResponse {
		return {
			id: schoolExternalToolDO.id as string,
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
