import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { Injectable } from '@nestjs/common';
import { SchoolExternalToolResponse } from '../dto/response/school-external-tool.response';

@Injectable()
export class SchoolExternalToolResponseMapper {
	mapToResponse(schoolExternalToolDO: SchoolExternalToolDO): SchoolExternalToolResponse {
		return new SchoolExternalToolResponse({
			id: schoolExternalToolDO.id ?? '',
			toolId: schoolExternalToolDO.toolId,
			schoolId: schoolExternalToolDO.schoolId,
			parameters: schoolExternalToolDO.parameters,
			version: schoolExternalToolDO.toolVersion,
		});
	}
}
