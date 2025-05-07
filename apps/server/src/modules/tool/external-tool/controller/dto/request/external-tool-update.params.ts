import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { ToolConfigType, ToolContextType } from '../../../../common/enum';
import {
	BasicToolConfigParams,
	ExternalToolConfigCreateParams,
	Lti11ToolConfigUpdateParams,
	Oauth2ToolConfigUpdateParams,
} from './config';
import { CustomParameterPostParams } from './custom-parameter.params';
import { ExternalToolMediumParams } from './external-tool-medium.params';

@ApiExtraModels(Lti11ToolConfigUpdateParams, Oauth2ToolConfigUpdateParams, BasicToolConfigParams)
export class ExternalToolUpdateParams {
	@IsString()
	@ApiProperty({ type: String, description: 'ID of the external tool' })
	public id!: string;

	@IsString()
	@ApiProperty()
	public name!: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({ type: String, description: 'Description of the external tool' })
	public description?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({ type: String, description: 'URL of the external tool' })
	public url?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({ type: String, description: 'URL of the logo of the external tool' })
	public logoUrl?: string;

	@IsUrl()
	@IsOptional()
	@ApiPropertyOptional({ type: String, description: 'URL of the thumbnail of the external tool' })
	public thumbnailUrl?: string;

	@ValidateNested()
	@Type(() => ExternalToolConfigCreateParams, {
		keepDiscriminatorProperty: true,
		discriminator: {
			property: 'type',
			subTypes: [
				{ value: Lti11ToolConfigUpdateParams, name: ToolConfigType.LTI11 },
				{ value: Oauth2ToolConfigUpdateParams, name: ToolConfigType.OAUTH2 },
				{ value: BasicToolConfigParams, name: ToolConfigType.BASIC },
			],
		},
	})
	@ApiProperty({
		description: 'Configuration of the external tool',
		oneOf: [
			{ $ref: getSchemaPath(BasicToolConfigParams) },
			{ $ref: getSchemaPath(Lti11ToolConfigUpdateParams) },
			{ $ref: getSchemaPath(Oauth2ToolConfigUpdateParams) },
		],
	})
	public config!: Lti11ToolConfigUpdateParams | Oauth2ToolConfigUpdateParams | BasicToolConfigParams;

	@ValidateNested({ each: true })
	@IsArray()
	@IsOptional()
	@ApiPropertyOptional({ type: [CustomParameterPostParams], description: 'Custom parameters of the external tool' })
	@Type(() => CustomParameterPostParams)
	public parameters?: CustomParameterPostParams[];

	@IsBoolean()
	@ApiProperty({ type: Boolean, default: false })
	public isHidden!: boolean;

	@IsBoolean()
	@ApiProperty({
		type: Boolean,
		default: false,
		description: 'Tool can be deactivated, related tools can not be added to e.g. school, course or board anymore',
	})
	public isDeactivated!: boolean;

	@IsBoolean()
	@ApiProperty({ type: Boolean, default: false, description: 'Open the tool in a new tab' })
	public openNewTab!: boolean;

	@IsArray()
	@IsOptional()
	@IsEnum(ToolContextType, { each: true })
	@ApiPropertyOptional({
		enum: ToolContextType,
		enumName: 'ToolContextType',
		isArray: true,
		description: 'Restrict the tool to certain contexts',
	})
	public restrictToContexts?: ToolContextType[];

	@ValidateNested()
	@IsOptional()
	@ApiPropertyOptional({ type: ExternalToolMediumParams, description: 'Medium of the external tool' })
	public medium?: ExternalToolMediumParams;

	@IsBoolean()
	@ApiProperty({ type: Boolean, default: false, description: 'Should the tool be a preferred tool' })
	public isPreferred!: boolean;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'Name of the icon to be rendered when displaying it as a preferred tool',
	})
	public iconName?: string;

	@IsBoolean()
	@ApiProperty({ type: Boolean, description: 'Is the external tool is draft' })
	public isDraft!: boolean;

	@IsBoolean()
	@ApiProperty({ type: Boolean, description: 'Is the external tool is template' })
	public isTemplate!: boolean;
}
