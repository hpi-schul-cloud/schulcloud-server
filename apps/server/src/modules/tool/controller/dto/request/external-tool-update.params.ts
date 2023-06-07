import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ToolConfigType } from '../../../interface';
import {
	BasicToolConfigParams,
	ExternalToolConfigCreateParams,
	Lti11ToolConfigUpdateParams,
	Oauth2ToolConfigUpdateParams,
} from './config';
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
