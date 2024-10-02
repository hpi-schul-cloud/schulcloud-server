import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { ToolContextType } from '../../../../common/enum';
import { BasicToolConfigParams, Lti11ToolConfigCreateParams, Oauth2ToolConfigCreateParams } from '../request';
import { BasicToolConfigResponse, Lti11ToolConfigResponse, Oauth2ToolConfigResponse } from './config';
import { CustomParameterResponse } from './custom-parameter.response';
import { ExternalToolMediumResponse } from './external-tool-medium.response';

export class ExternalToolResponse {
	@ApiProperty({ type: String, description: 'Id of the external tool' })
	id: string;

	@ApiProperty({ type: String, description: 'Name of the external tool' })
	name: string;

	@ApiPropertyOptional({ type: String, description: 'Description of the external tool' })
	description?: string;

	@ApiPropertyOptional({ type: String, description: 'URL of the external tool' })
	url?: string;

	@ApiPropertyOptional({ type: String, description: 'URL of the logo of the external tool' })
	logoUrl?: string;

	@ApiPropertyOptional({ type: String, description: 'URL of the thumbnail of the external tool' })
	thumbnailUrl?: string;

	@ApiProperty({
		description: 'Configuration of the external tool',
		oneOf: [
			{ $ref: getSchemaPath(BasicToolConfigParams) },
			{ $ref: getSchemaPath(Lti11ToolConfigCreateParams) },
			{ $ref: getSchemaPath(Oauth2ToolConfigCreateParams) },
		],
	})
	config: BasicToolConfigResponse | Oauth2ToolConfigResponse | Lti11ToolConfigResponse;

	@ApiProperty({ type: [CustomParameterResponse], description: 'Custom parameters of the external tool' })
	parameters: CustomParameterResponse[];

	@ApiProperty({ type: Boolean, description: 'Is the external tool hidden' })
	isHidden: boolean;

	@ApiProperty({ type: Boolean, description: 'Is the external tool deactivated' })
	isDeactivated: boolean;

	@ApiProperty({ type: Boolean, description: 'Should the external tool be opened in a new tab' })
	openNewTab: boolean;

	@ApiPropertyOptional({
		enum: ToolContextType,
		enumName: 'ToolContextType',
		isArray: true,
		description: 'Contexts in which the external tool is restricted',
	})
	restrictToContexts?: ToolContextType[];

	@ApiPropertyOptional({ type: ExternalToolMediumResponse, description: 'Medium of the external tool' })
	medium?: ExternalToolMediumResponse;

	@ApiProperty({ type: Boolean, description: 'Should the tool be a preferred tool' })
	isPreferred: boolean;

	@ApiPropertyOptional({
		type: String,
		description: 'Name of the icon to be rendered when displaying it as a preferred tool',
	})
	iconName?: string;

	constructor(response: ExternalToolResponse) {
		this.id = response.id;
		this.name = response.name;
		this.description = response.description;
		this.url = response.url;
		this.logoUrl = response.logoUrl;
		this.thumbnailUrl = response.thumbnailUrl;
		this.config = response.config;
		this.parameters = response.parameters;
		this.isHidden = response.isHidden;
		this.isDeactivated = response.isDeactivated;
		this.openNewTab = response.openNewTab;
		this.restrictToContexts = response.restrictToContexts;
		this.medium = response.medium;
		this.isPreferred = response.isPreferred;
		this.iconName = response.iconName;
	}
}
