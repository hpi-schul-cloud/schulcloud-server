import { Embeddable, Property } from '@mikro-orm/decorators/legacy';

@Embeddable()
export class CustomParameterEntryEntity {
	@Property()
	name: string;

	@Property()
	value?: string;

	constructor(props: CustomParameterEntryEntity) {
		this.name = props.name;
		this.value = props.value;
	}
}
