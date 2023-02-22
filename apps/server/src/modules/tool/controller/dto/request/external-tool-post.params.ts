import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CustomParameterPostParams } from './custom-parameter.params';
import { BasicToolConfigParams } from './basic-tool-config.params';
import { ExternalToolConfigCreateParams } from './external-tool-config.params';
import { Oauth2ToolConfigParams } from './oauth2-tool-config.params';
import { ToolConfigType } from '../../../interface';
import { Lti11ToolConfigParams } from './lti11-tool-config.params';

@ApiExtraModels(Lti11ToolConfigParams, Oauth2ToolConfigParams, BasicToolConfigParams)
export class ExternalToolPostParams {
	@IsString()
	@IsOptional()
	@ApiProperty()
	id?: string;

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
				{ value: Lti11ToolConfigParams, name: ToolConfigType.LTI11 },
				{ value: Oauth2ToolConfigParams, name: ToolConfigType.OAUTH2 },
				{ value: BasicToolConfigParams, name: ToolConfigType.BASIC },
			],
		},
	})
	@ApiProperty({
		oneOf: [
			{ $ref: getSchemaPath(BasicToolConfigParams) },
			{ $ref: getSchemaPath(Lti11ToolConfigParams) },
			{ $ref: getSchemaPath(Oauth2ToolConfigParams) },
		],
	})
	config!: Lti11ToolConfigParams | Oauth2ToolConfigParams | BasicToolConfigParams;

	@ValidateNested({ each: true })
	@IsArray()
	@IsOptional()
	@ApiPropertyOptional()
	@Type(/* istanbul ignore next */ () => CustomParameterPostParams)
	parameters?: CustomParameterPostParams[];

	@IsBoolean()
	@ApiProperty()
	isHidden!: boolean;

	@IsBoolean()
	@ApiProperty()
	openNewTab!: boolean;
}
