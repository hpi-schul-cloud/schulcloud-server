import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BasicToolConfigResponse, Oauth2ToolConfigResponse, Lti11ToolConfigResponse } from './config';
import { CustomParameterResponse } from './custom-parameter.response';
import { ToolContextType } from '../../../../common/enum';

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

	@ApiPropertyOptional({ enum: ToolContextType, enumName: 'ToolContextType', isArray: true })
	restrictToContexts?: ToolContextType[];

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
		this.restrictToContexts = response.restrictToContexts;
	}
}
