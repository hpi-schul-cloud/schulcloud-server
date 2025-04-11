import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
	CustomParameterLocationParams,
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
} from '../../../../common/enum';

export class CustomParameterPostParams {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'Technical name of the parameter that is send to the tool provider.' })
	public name!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'Display name that is shown in the user interface.' })
	public displayName!: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({ description: 'Additional description of the parameter in the user interface.' })
	public description?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({ description: 'Pre-fill value for the parameter. Required for global parameters.' })
	public defaultValue?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({ description: 'Regular expression to limit user input for this field.' })
	public regex?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({ description: 'A description for the regex.' })
	public regexComment?: string;

	@IsEnum(CustomParameterScopeTypeParams)
	@ApiProperty({
		enum: CustomParameterScopeTypeParams,
		enumName: 'CustomParameterScopeTypeParams',
		description: 'Scope where the parameter has to be configured.',
		example: CustomParameterScopeTypeParams.SCHOOL,
	})
	public scope!: CustomParameterScopeTypeParams;

	@IsEnum(CustomParameterLocationParams)
	@ApiProperty({
		enum: CustomParameterLocationParams,
		enumName: 'CustomParameterLocationParams',
		description: 'Location where the parameter is transmitted in the HTTP request to the tool provider.',
		example: CustomParameterLocationParams.QUERY,
	})
	public location!: CustomParameterLocationParams;

	@IsEnum(CustomParameterTypeParams)
	@ApiProperty({
		enum: CustomParameterTypeParams,
		enumName: 'CustomParameterTypeParams',
		description: 'Input field type. Auto parameters have to be global and cannot have a defaultValue.',
		example: CustomParameterTypeParams.BOOLEAN,
	})
	public type!: CustomParameterTypeParams;

	@IsBoolean()
	@ApiProperty({ description: 'If true, the parameter does not have to be filled out during configuration.' })
	public isOptional!: boolean;

	@IsBoolean()
	@ApiProperty({ description: 'If true, the parameter value is not copied to other contexts.' })
	public isProtected!: boolean;
}
