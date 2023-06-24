export const enum HealthStatuses {
	STATUS_PASS = 'pass',
	STATUS_FAIL = 'fail',
}

export interface HealthStatusCheckProps {
	componentType: string;
	componentId?: string;
	observedValue?: string | number | object;
	observedUnit?: string;
	status: string;
	time?: Date;
	output?: string;
}

export class HealthStatusCheck {
	componentType: string;

	componentId?: string;

	observedValue?: string | number | object;

	observedUnit?: string;

	status: string;

	time?: Date;

	output?: string;

	constructor(props: HealthStatusCheckProps) {
		this.componentType = props.componentType;
		this.componentId = props.componentId;
		this.observedValue = props.observedValue;
		this.observedUnit = props.observedUnit;
		this.status = props.status;
		this.time = props.time;
		this.output = props.output;
	}
}

interface HealthResponseChecks {
	[key: string]: Array<HealthStatusCheck>;
}

export interface HealthStatusProps {
	status: string;
	description?: string;
	output?: string;
	checks?: HealthResponseChecks;
}

export class HealthStatus {
	status: string;

	description?: string;

	output?: string;

	checks?: HealthResponseChecks;

	constructor(props: HealthStatusProps) {
		this.status = props.status;
		this.description = props.description;
		this.output = props.output;
		this.checks = props.checks;
	}

	isPassed(): boolean {
		return this.status === HealthStatuses.STATUS_PASS;
	}
}
