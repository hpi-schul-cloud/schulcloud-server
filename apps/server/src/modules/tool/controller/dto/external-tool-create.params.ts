import { IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExternalToolParams {
	@IsString()
	@ApiProperty()
	name!: string;

	@IsString()
	@ApiProperty()
	url?: string;

	@IsString()
	@ApiProperty()
	logoUrl?: string;

	@ApiProperty()
	config!: ExternalToolConfigParams;

	@ApiProperty()
	parameters?: CustomParameterParams[];

	@IsBoolean()
	@ApiProperty()
	isHidden!: boolean;

	@IsBoolean()
	@ApiProperty()
	openNewTab!: boolean;

	@ApiProperty()
	version?: number;
}
// TODO später auslagern 🧁
export class ExternalToolConfigParams {
	constructor(props: ExternalToolConfigParams) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}

	@ApiProperty()
	type: string;

	@ApiProperty()
	baseUrl: string;
}
// TODO später auslagern 🧁
export class CustomParameterParams {
	constructor(props: CustomParameterParams) {
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
	default: string;

	@IsString()
	@ApiProperty()
	regex: string;

	@ApiProperty()
	scope: string[];

	@ApiProperty()
	location: string[];

	@ApiProperty()
	type: string[];
}
