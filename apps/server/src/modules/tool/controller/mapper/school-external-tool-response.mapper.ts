import { Injectable } from '@nestjs/common';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { CustomParameterEntryDO } from '@shared/domain/domainobject/external-tool/custom-parameter-entry.do';
import { CustomParameterEntry } from '@shared/domain';
import { SchoolExternalToolSearchListResponse } from '../dto/response/school-external-tool-search-list.response';
import { SchoolExternalToolResponse } from '../dto/response/school-external-tool.response';
import { CustomParameterEntryResponse } from '../dto/response/custom-parameter-entry.response';

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
			toolId: schoolExternalToolDO.toolId,
			schoolId: schoolExternalToolDO.schoolId,
			parameters: this.mapToCustomParameterEntryResponse(schoolExternalToolDO.parameters),
			toolVersion: schoolExternalToolDO.toolVersion,
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
