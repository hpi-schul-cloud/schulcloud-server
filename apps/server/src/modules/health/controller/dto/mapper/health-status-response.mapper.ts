import { HealthStatus } from '../../../domain';
import { HealthStatusResponse, HealthStatusCheckResponse } from '../response';
import { HealthStatusCheckResponseMapper } from './health-status-check-response.mapper';

export class HealthStatusResponseMapper {
	static mapToResponse(healthStatus: HealthStatus): HealthStatusResponse {
		const response = new HealthStatusResponse({
			status: healthStatus.status,
			description: healthStatus.description,
			output: healthStatus.output,
		});

		if (healthStatus.checks !== undefined) {
			response.checks = {};

			for (const key of Object.keys(healthStatus.checks)) {
				const checks = healthStatus.checks[key];

				const responseChecks: Array<HealthStatusCheckResponse> = [];

				checks.forEach((check) => {
					responseChecks.push(HealthStatusCheckResponseMapper.mapToResponse(check));
				});

				response.checks[key] = responseChecks;
			}
		}

		return response;
	}
}
