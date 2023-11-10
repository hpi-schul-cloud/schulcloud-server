import { SchoolExternalToolMetadataResponse } from '../controller/dto/school-external-tool-metadata.response';
import { SchoolExternalToolMetadata } from '../domain/school-external-tool-metadata';

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
