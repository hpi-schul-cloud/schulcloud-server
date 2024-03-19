import { HealthStatusCheckResponse } from './health-status-check.response';

export class HealthStatusResponse {
	status: string;

	description?: string;

	output?: string;

	checks?: Record<string, Array<HealthStatusCheckResponse>>;

	constructor({ status, description, output, checks }: HealthStatusResponse) {
		this.status = status;
		this.description = description;
		this.output = output;
		this.checks = checks;
	}
}
