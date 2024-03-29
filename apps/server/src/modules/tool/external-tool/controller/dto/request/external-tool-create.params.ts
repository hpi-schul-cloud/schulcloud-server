import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ToolConfigType, ToolContextType } from '../../../../common/enum';
import {
	BasicToolConfigParams,
	ExternalToolConfigCreateParams,
	Lti11ToolConfigCreateParams,
	Oauth2ToolConfigCreateParams,
} from './config';
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
	@ApiProperty({
		type: Boolean,
		default: false,
		description: 'Tool can be deactivated, related tools can not be added to e.g. school, course or board anymore',
	})
	isDeactivated!: boolean;

	@IsBoolean()
	@ApiProperty()
	openNewTab!: boolean;

	@IsArray()
	@IsOptional()
	@IsEnum(ToolContextType, { each: true })
	@ApiPropertyOptional({ enum: ToolContextType, enumName: 'ToolContextType', isArray: true })
	restrictToContexts?: ToolContextType[];
}
