import { ExternalToolConfigResponse } from '@src/modules/tool/controller/dto/response/external-tool-config.response';
import { CustomParameterResponse } from '@src/modules/tool/controller/dto/response/custom-parameter.response';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BasicToolConfigResponse } from '@src/modules/tool/controller/dto/response/basic-tool-config.response';
import { Oauth2ToolConfigResponse } from '@src/modules/tool/controller/dto/response/oauth2-tool-config.response';
import { Lti11ToolConfigResponse } from '@src/modules/tool/controller/dto/response/lti11-tool-config.response';

export class ExternalToolResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	url: string;

	@ApiPropertyOptional()
	logoUrl?: string;

	@ApiProperty()
	config: BasicToolConfigResponse | Oauth2ToolConfigResponse | Lti11ToolConfigResponse;

	@ApiProperty()
	parameters: CustomParameterResponse;

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
