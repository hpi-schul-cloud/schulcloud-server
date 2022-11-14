import { CustomParameterLocation } from '@src/modules/tool/interface/custom-parameter-location.enum';
import { CustomParameterScope } from '@src/modules/tool/interface/custom-parameter-scope.enum';
import { CustomParameterType } from '@src/modules/tool/interface/custom-parameter-type.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomParameterResponse {
	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	default?: string;

	@ApiPropertyOptional()
	regex?: string;

	@ApiProperty()
	scope: CustomParameterScope;

	@ApiProperty()
	location: CustomParameterLocation;

	@ApiProperty()
	type: CustomParameterType;

	constructor(props: CustomParameterResponse) {
		this.name = props.name;
		this.default = props.default;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
	}
}
