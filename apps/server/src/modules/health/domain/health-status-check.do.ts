import { HealthStatuses } from './health-statuses.do';

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

	isPassed(): boolean {
		return this.status === HealthStatuses.STATUS_PASS;
	}
}
