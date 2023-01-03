import { Injectable } from '@nestjs/common';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { SchoolExternalToolListResponse, SchoolExternalToolResponse } from '../dto';

@Injectable()
export class SchoolExternalToolMapper {
	mapExternalToolDOsToSchoolExternalToolListResponse(externalTools: ExternalToolDO[]): SchoolExternalToolListResponse {
		return new SchoolExternalToolListResponse(this.mapExternalToolDOsToSchoolExternalToolResponses(externalTools));
	}

	private mapExternalToolDOsToSchoolExternalToolResponses(
		externalTools: ExternalToolDO[]
	): SchoolExternalToolResponse[] {
		return externalTools.map(
			(tool: ExternalToolDO) =>
				new SchoolExternalToolResponse({
					id: tool.id || '',
					name: tool.name,
					logoUrl: tool.logoUrl,
				})
		);
	}
}
