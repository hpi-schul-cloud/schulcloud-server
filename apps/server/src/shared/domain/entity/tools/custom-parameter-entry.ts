import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class CustomParameterEntry {
	@Property()
	name: string;

	@Property()
	value?: string;

	constructor(props: CustomParameterEntry) {
		this.name = props.name;
		this.value = props.value;
	}
}
