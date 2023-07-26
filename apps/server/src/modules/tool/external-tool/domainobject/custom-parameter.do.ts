import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '../entity';

export class CustomParameterDO {
	name: string;

	displayName: string;

	description?: string;

	default?: string;

	regex?: string;

	regexComment?: string;

	scope: CustomParameterScope;

	location: CustomParameterLocation;

	type: CustomParameterType;

	isOptional: boolean;

	constructor(props: CustomParameterDO) {
		this.name = props.name;
		this.displayName = props.displayName;
		this.description = props.description;
		this.default = props.default;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
		this.regexComment = props.regexComment;
		this.isOptional = props.isOptional;
	}
}
