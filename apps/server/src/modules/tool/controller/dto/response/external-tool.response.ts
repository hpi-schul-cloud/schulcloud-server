import { ApiProperty } from '@nestjs/swagger';
import { ExternalToolConfigResponseParams } from '@src/modules/tool/controller/dto/response/external-tool-config-response.params';
import { CustomParameterResponseParams } from '@src/modules/tool/controller/dto/response/custom-parameter-response.params';

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
	config: ExternalToolConfigResponseParams;

	@ApiProperty()
	parameters: CustomParameterResponseParams;

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
