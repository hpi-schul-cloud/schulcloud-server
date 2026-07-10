import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { ToolConfigType, ToolContextType } from '../../../../common/enum';
import {
	BasicToolConfigParams,
	ExternalToolConfigCreateParams,
	Lti11ToolConfigCreateParams,
	Oauth2ToolConfigCreateParams,
} from './config';
import { CustomParameterPostParams } from './custom-parameter.params';
import { ExternalToolMediumParams } from './external-tool-medium.params';

@ApiExtraModels(Lti11ToolConfigCreateParams, Oauth2ToolConfigCreateParams, BasicToolConfigParams)
export class ExternalToolCreateParams {
	@IsString()
	@ApiProperty({ type: String, description: 'Name of the external tool' })
	name!: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({ type: String, description: 'Description of the external tool' })
	description?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({ type: String, description: 'URL of the external tool' })
	url?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({ type: String, description: 'URL of the logo of the external tool' })
	logoUrl?: string;

	@IsUrl()
	@IsOptional()
	@ApiPropertyOptional({ type: String, description: 'URL of the thumbnail of the external tool' })
	thumbnailUrl?: string;

	@ValidateNested()
	@Type(() => ExternalToolConfigCreateParams, {
		keepDiscriminatorProperty: true,
		discriminator: {
			property: 'type',
			subTypes: [
				{ value: Lti11ToolConfigCreateParams, name: ToolConfigType.LTI11 },
				{ value: Oauth2ToolConfigCreateParams, name: ToolConfigType.OAUTH2 },
				{ value: BasicToolConfigParams, name: ToolConfigType.BASIC },
			],
		},
	})
	@ApiProperty({
		description: 'Configuration of the external tool',
		oneOf: [
			{ $ref: getSchemaPath(BasicToolConfigParams) },
			{ $ref: getSchemaPath(Lti11ToolConfigCreateParams) },
			{ $ref: getSchemaPath(Oauth2ToolConfigCreateParams) },
		],
	})
	config!: Lti11ToolConfigCreateParams | Oauth2ToolConfigCreateParams | BasicToolConfigParams;

	@ValidateNested({ each: true })
	@IsArray()
	@IsOptional()
	@ApiPropertyOptional({ type: [CustomParameterPostParams], description: 'Custom parameters of the external tool' })
	@Type(() => CustomParameterPostParams)
	parameters?: CustomParameterPostParams[];

	@IsBoolean()
	@ApiProperty({ description: 'Tool can be hidden, those tools cant be added to e.g. school, course or board' })
	isHidden!: boolean;

	@IsBoolean()
	@ApiProperty({
		type: Boolean,
		default: false,
		description: 'Tool can be deactivated, related tools can not be added to e.g. school, course or board anymore',
	})
	isDeactivated!: boolean;

	@IsBoolean()
	@ApiProperty({ description: 'Tool should be opened in a new tab' })
	openNewTab!: boolean;

	@IsArray()
	@IsOptional()
	@IsEnum(ToolContextType, { each: true })
	@ApiPropertyOptional({
		enum: ToolContextType,
		enumName: 'ToolContextType',
		isArray: true,
		description: 'Restrict tools to specific contexts',
	})
	restrictToContexts?: ToolContextType[];

	@ValidateNested()
	@IsOptional()
	@ApiPropertyOptional({ type: ExternalToolMediumParams, description: 'Medium of the external tool' })
	medium?: ExternalToolMediumParams;

	@IsBoolean()
	@ApiProperty({ type: Boolean, description: 'Should the tool be a preferred tool', default: false })
	isPreferred!: boolean;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'Name of the icon to be rendered when displaying it as a preferred tool',
	})
	iconName?: string;
}
