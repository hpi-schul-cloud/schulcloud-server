import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomParameterScope, CustomParameterLocation, CustomParameterType } from '@shared/domain';

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
