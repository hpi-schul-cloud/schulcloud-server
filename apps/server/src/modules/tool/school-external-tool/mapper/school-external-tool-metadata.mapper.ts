import { ContextExternalToolCountPerContextResponse } from '../../common/controller/dto';
import { type SchoolExternalToolUtilization } from '../../tool-utilization/domain';
import { SchoolExternalToolMetadataResponse } from '../controller/dto';

export class SchoolExternalToolMetadataMapper {
	public static mapToSchoolExternalToolMetadataResponse(
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
