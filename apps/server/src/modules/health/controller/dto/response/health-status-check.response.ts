export class HealthStatusCheckResponse {
	componentType: string;

	componentId?: string;

	observedValue?: string | number | object;

	observedUnit?: string;

	status: string;

	time?: Date;

	output?: string;

	constructor({
		componentType,
		componentId,
		observedValue,
		observedUnit,
		status,
		time,
		output,
	}: HealthStatusCheckResponse) {
		this.componentType = componentType;
		this.componentId = componentId;
		this.observedValue = observedValue;
		this.observedUnit = observedUnit;
		this.status = status;
		this.time = time;
		this.output = output;
	}
}
