import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { ToolConfigType } from '@src/modules/tool/common/enum/tool-config-type.enum';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BasicToolConfigParams } from './config/basic-tool-config.params';
import { ExternalToolConfigCreateParams } from './config/external-tool-config.params';
import { Lti11ToolConfigUpdateParams } from './config/lti11-tool-config-update.params';
import { Oauth2ToolConfigUpdateParams } from './config/oauth2-tool-config-update.params';
import { CustomParameterPostParams } from './custom-parameter.params';

@ApiExtraModels(Lti11ToolConfigUpdateParams, Oauth2ToolConfigUpdateParams, BasicToolConfigParams)
export class ExternalToolUpdateParams {
	@IsString()
	@ApiProperty()
	id!: string;

	@IsString()
	@ApiProperty()
	name!: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	url?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	logoUrl?: string;

	@ValidateNested()
	@Type(/* istanbul ignore next */ () => ExternalToolConfigCreateParams, {
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
		oneOf: [
			{ $ref: getSchemaPath(BasicToolConfigParams) },
			{ $ref: getSchemaPath(Lti11ToolConfigUpdateParams) },
			{ $ref: getSchemaPath(Oauth2ToolConfigUpdateParams) },
		],
	})
	config!: Lti11ToolConfigUpdateParams | Oauth2ToolConfigUpdateParams | BasicToolConfigParams;

	@ValidateNested({ each: true })
	@IsArray()
	@IsOptional()
	@ApiPropertyOptional({ type: [CustomParameterPostParams] })
	@Type(/* istanbul ignore next */ () => CustomParameterPostParams)
	parameters?: CustomParameterPostParams[];

	@IsBoolean()
	@ApiProperty()
	isHidden!: boolean;

	@IsBoolean()
	@ApiProperty()
	openNewTab!: boolean;
}
