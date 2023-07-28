import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '../../../common/enum';

@Embeddable()
export class CustomParameter {
	@Property()
	name: string;

	@Property()
	displayName: string;

	@Property({ nullable: true })
	description?: string;

	@Property({ nullable: true })
	default?: string;

	@Property({ nullable: true })
	regex?: string;

	@Property({ nullable: true })
	regexComment?: string;

	@Enum()
	scope: CustomParameterScope;

	@Enum()
	location: CustomParameterLocation;

	@Enum()
	type: CustomParameterType;

	@Property()
	isOptional: boolean;

	constructor(props: CustomParameter) {
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
