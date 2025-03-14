import { ContextExternalToolCountPerContextResponse } from '../../common/controller/dto';
import { ExternalToolUtilizationResponse } from '../controller/dto';
import { ExternalToolUtilization } from '../domain';

export class ExternalToolUtilizationMapper {
	static mapToExternalToolUtilizationResponse(
		externalToolUtilization: ExternalToolUtilization
	): ExternalToolUtilizationResponse {
		const externalToolUtilizationResponse: ExternalToolUtilizationResponse = new ExternalToolUtilizationResponse({
			schoolExternalToolCount: externalToolUtilization.schoolExternalToolCount,
			contextExternalToolCountPerContext: new ContextExternalToolCountPerContextResponse(
				externalToolUtilization.contextExternalToolCountPerContext
			),
		});

		return externalToolUtilizationResponse;
	}
}
