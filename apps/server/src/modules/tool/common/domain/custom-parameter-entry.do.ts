export class CustomParameterEntry {
	public name: string;

	public value?: string;

	constructor(props: CustomParameterEntry) {
		this.name = props.name;
		this.value = props.value;
	}
}
