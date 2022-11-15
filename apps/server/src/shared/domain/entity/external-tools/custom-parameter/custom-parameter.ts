import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { CustomParameterScope } from './custom-parameter-scope.enum';
import { CustomParameterLocation } from './custom-parameter-location.enum';
import { CustomParameterType } from './custom-parameter-type.enum';

@Embeddable()
export class CustomParameter {
	constructor(props: CustomParameter) {
		this.name = props.name;
		this.default = props.default;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
	}

	@Property()
	name: string;

	@Property()
	default: string;

	@Property()
	regex: string;

	@Enum()
	scope: CustomParameterScope;

	@Enum()
	location: CustomParameterLocation;

	@Enum()
	type: CustomParameterType;
}
