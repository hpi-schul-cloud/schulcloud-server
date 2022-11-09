import { Embeddable } from '@mikro-orm/core';

@Embeddable()
export class CustomParameterEntry {
	constructor(props: CustomParameterEntry) {
		this.name = props.name;
		this.value = props.value;
	}

	name: string;

	value?: string;
}
