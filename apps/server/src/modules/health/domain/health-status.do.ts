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
				const checks = this.checks[key];

				for (let i = 0; i < checks.length; i += 1) {
					if (!checks[i].isPassed()) {
						return false;
					}
				}
			}
		}

		return this.status === HealthStatuses.STATUS_PASS;
	}
}
