import { CustomParameterLocation } from '@src/modules/tool/interface/custom-parameter-location.enum';
import { CustomParameterScope } from '@src/modules/tool/interface/custom-parameter-scope.enum';
import { CustomParameterType } from '@src/modules/tool/interface/custom-parameter-type.enum';

export class CustomParameterResponse {
	name: string;

	default?: string;

	regex?: string;

	scope: CustomParameterScope[];

	location: CustomParameterLocation[];

	type: CustomParameterType[];

	constructor(props: CustomParameterResponse) {
		this.name = props.name;
		this.default = props.default;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
	}
}
