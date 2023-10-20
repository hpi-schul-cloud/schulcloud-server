export class CustomParameterEntryDO {
	name: string;

	value?: string;

	constructor(props: CustomParameterEntryDO) {
		this.name = props.name;
		this.value = props.value;
	}
}
