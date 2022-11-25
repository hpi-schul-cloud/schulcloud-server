import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '@shared/domain';

export class CustomParameterDO {
	name: string;

	default?: string;

	regex?: string;

	scope: CustomParameterScope;

	location: CustomParameterLocation;

	type: CustomParameterType;

	constructor(props: CustomParameterDO) {
		this.name = props.name;
		this.default = props.default;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
	}
}
