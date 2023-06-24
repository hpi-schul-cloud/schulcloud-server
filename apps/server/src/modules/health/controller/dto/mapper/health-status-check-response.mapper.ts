import { HealthStatusCheck } from '../../../domain';
import { HealthStatusCheckResponse } from '../response';

export class HealthStatusCheckResponseMapper {
	static mapToResponse(healthStatusCheck: HealthStatusCheck): HealthStatusCheckResponse {
		return new HealthStatusCheckResponse({
			componentType: healthStatusCheck.componentType,
			componentId: healthStatusCheck.componentId,
			observedValue: healthStatusCheck.observedValue,
			observedUnit: healthStatusCheck.observedUnit,
			status: healthStatusCheck.status,
			time: healthStatusCheck.time,
			output: healthStatusCheck.output,
		});
	}
}
