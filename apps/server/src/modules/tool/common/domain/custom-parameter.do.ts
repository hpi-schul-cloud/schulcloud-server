import { type CustomParameterScope, type CustomParameterLocation, type CustomParameterType } from '../enum';

export class CustomParameter {
	public name: string;

	public displayName: string;

	public description?: string;

	public default?: string;

	public regex?: string;

	public regexComment?: string;

	public scope: CustomParameterScope;

	public location: CustomParameterLocation;

	public type: CustomParameterType;

	public isOptional: boolean;

	public isProtected: boolean;

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
		this.isProtected = props.isProtected;
	}
}
