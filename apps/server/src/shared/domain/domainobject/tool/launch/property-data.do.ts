import { PropertyLocation } from './property-location';

export class PropertyDataDO {
	name: string;

	value: string;

	location: PropertyLocation;

	constructor(props: PropertyDataDO) {
		this.name = props.name;
		this.value = props.value;
		this.location = props.location;
	}
}
