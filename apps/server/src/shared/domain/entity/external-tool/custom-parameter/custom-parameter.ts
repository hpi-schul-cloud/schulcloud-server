import { Embeddable } from '@mikro-orm/core';
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

	name: string;

	default: string;

	regex: string;

	scope: CustomParameterScope;

	location: CustomParameterLocation;

	type: CustomParameterType;
}
