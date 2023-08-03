export class CustomParameterEntry {
	name: string;

	value?: string;

	constructor(props: CustomParameterEntry) {
		this.name = props.name;
		this.value = props.value;
	}
}
