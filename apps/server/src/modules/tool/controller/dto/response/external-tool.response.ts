import { ApiProperty } from '@nestjs/swagger';
import { ExternalToolConfigResponse } from '@src/modules/tool/controller/dto/response/external-tool-config.response';
import { CustomParameterResponse } from '@src/modules/tool/controller/dto/response/custom-parameter.response';

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
