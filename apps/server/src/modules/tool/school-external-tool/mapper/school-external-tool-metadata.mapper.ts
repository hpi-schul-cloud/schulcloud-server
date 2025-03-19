import { ContextExternalToolCountPerContextResponse } from '../../common/controller/dto';
import { SchoolExternalToolMetadataResponse } from '../controller/dto';
import { SchoolExternalToolUtilization } from '../domain';

export class SchoolExternalToolMetadataMapper {
	static mapToSchoolExternalToolMetadataResponse(
		schoolExternalToolUtilization: SchoolExternalToolUtilization
	): SchoolExternalToolMetadataResponse {
		const externalToolUtilizationResponse: SchoolExternalToolMetadataResponse = new SchoolExternalToolMetadataResponse({
			contextExternalToolCountPerContext: new ContextExternalToolCountPerContextResponse(
				schoolExternalToolUtilization.contextExternalToolCountPerContext
			),
		});

		return externalToolUtilizationResponse;
	}
}
