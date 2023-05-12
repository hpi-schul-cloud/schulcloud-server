import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BasicToolConfigResponse, Lti11ToolConfigResponse, Oauth2ToolConfigResponse } from './config';
import { CustomParameterResponse } from './custom-parameter.response';

export class ExternalToolResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	url?: string;

	@ApiPropertyOptional()
	logoUrl?: string;

	@ApiProperty()
	config: BasicToolConfigResponse | Oauth2ToolConfigResponse | Lti11ToolConfigResponse;

	@ApiProperty()
	parameters: CustomParameterResponse[];

	@ApiProperty()
	isHidden: boolean;

	@ApiProperty()
	openNewTab: boolean;

	@ApiProperty()
	version: number;

	constructor(response: ExternalToolResponse) {
		this.id = response.id;
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
