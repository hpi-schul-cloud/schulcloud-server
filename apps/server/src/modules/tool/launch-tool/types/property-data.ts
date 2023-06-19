import { PropertyLocation } from './property-location';

export class PropertyData {
	name: string;

	value: string;

	location?: PropertyLocation;

	constructor(props: PropertyData) {
		this.name = props.name;
		this.value = props.value;
		this.location = props.location;
	}
}
