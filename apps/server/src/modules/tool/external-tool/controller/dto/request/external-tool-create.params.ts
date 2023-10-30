import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { ToolConfigType } from '@src/modules/tool/common/enum/tool-config-type.enum';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BasicToolConfigParams } from './config/basic-tool-config.params';
import { ExternalToolConfigCreateParams } from './config/external-tool-config.params';
import { Lti11ToolConfigCreateParams } from './config/lti11-tool-config-create.params';
import { Oauth2ToolConfigCreateParams } from './config/oauth2-tool-config-create.params';
import { CustomParameterPostParams } from './custom-parameter.params';

@ApiExtraModels(Lti11ToolConfigCreateParams, Oauth2ToolConfigCreateParams, BasicToolConfigParams)
export class ExternalToolCreateParams {
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
				{ value: Lti11ToolConfigCreateParams, name: ToolConfigType.LTI11 },
				{ value: Oauth2ToolConfigCreateParams, name: ToolConfigType.OAUTH2 },
				{ value: BasicToolConfigParams, name: ToolConfigType.BASIC },
			],
		},
	})
	@ApiProperty({
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
