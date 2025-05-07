import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { ToolContextType } from '../../../../common/enum';
import { BasicToolConfigParams, Lti11ToolConfigCreateParams, Oauth2ToolConfigCreateParams } from '../request';
import { BasicToolConfigResponse, Lti11ToolConfigResponse, Oauth2ToolConfigResponse } from './config';
import { CustomParameterResponse } from './custom-parameter.response';
import { ExternalToolMediumResponse } from './external-tool-medium.response';

export class ExternalToolResponse {
	@ApiProperty({ type: String, description: 'Id of the external tool' })
	public id: string;

	@ApiProperty({ type: String, description: 'Name of the external tool' })
	public name: string;

	@ApiPropertyOptional({ type: String, description: 'Description of the external tool' })
	public description?: string;

	@ApiPropertyOptional({ type: String, description: 'URL of the external tool' })
	public url?: string;

	@ApiPropertyOptional({ type: String, description: 'URL of the logo of the external tool' })
	public logoUrl?: string;

	@ApiPropertyOptional({ type: String, description: 'URL of the thumbnail of the external tool' })
	public thumbnailUrl?: string;

	@ApiProperty({
		description: 'Configuration of the external tool',
		oneOf: [
			{ $ref: getSchemaPath(BasicToolConfigParams) },
			{ $ref: getSchemaPath(Lti11ToolConfigCreateParams) },
			{ $ref: getSchemaPath(Oauth2ToolConfigCreateParams) },
		],
	})
	public config: BasicToolConfigResponse | Oauth2ToolConfigResponse | Lti11ToolConfigResponse;

	@ApiProperty({ type: [CustomParameterResponse], description: 'Custom parameters of the external tool' })
	public parameters: CustomParameterResponse[];

	@ApiProperty({ type: Boolean, description: 'Is the external tool hidden' })
	public isHidden: boolean;

	@ApiProperty({ type: Boolean, description: 'Is the external tool deactivated' })
	public isDeactivated: boolean;

	@ApiProperty({ type: Boolean, description: 'Should the external tool be opened in a new tab' })
	public openNewTab: boolean;

	@ApiPropertyOptional({
		enum: ToolContextType,
		enumName: 'ToolContextType',
		isArray: true,
		description: 'Contexts in which the external tool is restricted',
	})
	public restrictToContexts?: ToolContextType[];

	@ApiPropertyOptional({ type: ExternalToolMediumResponse, description: 'Medium of the external tool' })
	public medium?: ExternalToolMediumResponse;

	@ApiProperty({ type: Boolean, description: 'Should the tool be a preferred tool' })
	public isPreferred: boolean;

	@ApiPropertyOptional({
		type: String,
		description: 'Name of the icon to be rendered when displaying it as a preferred tool',
	})
	public iconName?: string;

	@ApiProperty({ type: Boolean, description: 'Is the external tool is draft' })
	public isDraft: boolean;

	@ApiProperty({ type: Boolean, description: 'Is the external tool is template' })
	public isTemplate: boolean;

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
		this.isDraft = response.isDraft;
		this.isTemplate = response.isTemplate;
	}
}
