import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '@shared/domain';

export class CustomParameterDO {
	name: string;

	default?: string;

	regex?: string;

	regexComment?: string;

	scope: CustomParameterScope;

	location: CustomParameterLocation;

	type: CustomParameterType;

	isOptional: boolean;

	constructor(props: CustomParameterDO) {
		this.name = props.name;
		this.default = props.default;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
		this.regexComment = props.regexComment;
		this.isOptional = props.isOptional;
	}
	// TODO function in DO that is not an attribute...
	/* isRegexCommentMandatoryAndFilled(): boolean {
		if (this.regex && !this.regexComment) {
			return false;
		}
		return true;
	} */
}
