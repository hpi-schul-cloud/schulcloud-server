import { ContextExternalToolCountPerContextResponse } from '../../common/controller/dto';
import { type ExternalToolUtilization } from '../../tool-utilization/domain';
import { ExternalToolUtilizationResponse } from '../controller/dto';

export class ExternalToolUtilizationMapper {
	public static mapToExternalToolUtilizationResponse(
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
