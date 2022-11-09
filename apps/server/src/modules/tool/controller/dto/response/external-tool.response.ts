import { ApiProperty } from '@nestjs/swagger';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { IsString } from 'class-validator';

export class ExternalToolResponse {
	@ApiProperty()
	externalToolId: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	url: string;

	@ApiProperty()
	logoUrl?: string;

	@ApiProperty()
	config: ExternalToolConfigResponse;

	@ApiProperty()
	parameters: CustomParameterResponse;

	@ApiProperty()
	isHidden: boolean;

	@ApiProperty()
	openNewTab: boolean;

	@ApiProperty()
	version: number;

	constructor(response: ExternalToolResponse) {
		this.externalToolId = response.externalToolId;
		this.name = response.name;
		this.url = response.url;
		this.logoUrl = response.logoUrl;
		this.config = response.config;
		this.parameters = response.parameters;
		this.isHidden = response.isHidden;
		this.openNewTab = response.openNewTab;
		this.version = response.version;
	}
}
// TODO später auslagern 🧁
export class ExternalToolConfigResponse {
	constructor(props: ExternalToolConfigResponse) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}

	@ApiProperty()
	type: ToolConfigType;

	@ApiProperty()
	baseUrl: string;
}
// TODO später auslagern 🧁
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
