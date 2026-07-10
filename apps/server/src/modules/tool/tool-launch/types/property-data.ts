import { type PropertyLocation } from './property-location';

export class PropertyData {
	public name: string;

	public value: string;

	public location?: PropertyLocation;

	constructor(props: PropertyData) {
		this.name = props.name;
		this.value = props.value;
		this.location = props.location;
	}
}
