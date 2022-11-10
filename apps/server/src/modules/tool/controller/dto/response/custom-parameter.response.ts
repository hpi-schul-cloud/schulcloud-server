import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomParameterResponse {
	constructor(props: CustomParameterResponse) {
		this.name = props.name;
		this.default = props.default;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
	}

	@IsString()
	@ApiProperty()
	name: string;

	@IsString()
	@ApiProperty()
	default?: string;

	@IsString()
	@ApiProperty()
	regex?: string;

	@ApiProperty()
	scope: string[];

	@ApiProperty()
	location: string[];

	@ApiProperty()
	type: string[];
}
