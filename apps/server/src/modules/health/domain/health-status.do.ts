import { HealthStatusCheck } from './health-status-check.do';
import { HealthStatuses } from './health-statuses.do';

export interface HealthStatusProps {
	status: string;
	description?: string;
	output?: string;
	checks?: Record<string, Array<HealthStatusCheck>>;
}

export class HealthStatus {
	status: string;

	description?: string;

	output?: string;

	checks?: Record<string, Array<HealthStatusCheck>>;

	constructor(props: HealthStatusProps) {
		this.status = props.status;
		this.description = props.description;
		this.output = props.output;
		this.checks = props.checks;
	}

	isPassed(): boolean {
		if (this.checks !== undefined) {
			for (const key of Object.keys(this.checks)) {
				for (const check of this.checks[key]) {
					if (!check.isPassed()) {
						return false;
					}
				}
			}
		}

		return this.status === HealthStatuses.STATUS_PASS;
	}
}
