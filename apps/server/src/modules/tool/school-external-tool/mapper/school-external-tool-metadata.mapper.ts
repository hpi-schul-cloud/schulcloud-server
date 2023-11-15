import { SchoolExternalToolMetadataResponse } from '../controller/dto';
import { SchoolExternalToolMetadata } from '../domain';

export class SchoolExternalToolMetadataMapper {
	static mapToSchoolExternalToolMetadataResponse(
		schoolExternalToolMetadata: SchoolExternalToolMetadata
	): SchoolExternalToolMetadataResponse {
		const externalToolMetadataResponse: SchoolExternalToolMetadataResponse = new SchoolExternalToolMetadataResponse({
			contextExternalToolCountPerContext: schoolExternalToolMetadata.contextExternalToolCountPerContext,
		});

		return externalToolMetadataResponse;
	}
}
