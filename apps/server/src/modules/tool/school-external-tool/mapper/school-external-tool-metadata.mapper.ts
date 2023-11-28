import { ContextExternalToolCountPerContextResponse } from '../../common/controller/dto';
import { SchoolExternalToolMetadataResponse } from '../controller/dto';
import { SchoolExternalToolMetadata } from '../domain';

export class SchoolExternalToolMetadataMapper {
	static mapToSchoolExternalToolMetadataResponse(
		schoolExternalToolMetadata: SchoolExternalToolMetadata
	): SchoolExternalToolMetadataResponse {
		const externalToolMetadataResponse: SchoolExternalToolMetadataResponse = new SchoolExternalToolMetadataResponse({
			contextExternalToolCountPerContext: new ContextExternalToolCountPerContextResponse(
				schoolExternalToolMetadata.contextExternalToolCountPerContext
			),
		});

		return externalToolMetadataResponse;
	}
}
