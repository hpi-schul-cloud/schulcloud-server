import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomParameterScopeParams } from '@src/modules/tool/interface/custom-parameter-scope.enum';
import { CustomParameterLocationParams } from '@src/modules/tool/interface/custom-parameter-location.enum';
import { CustomParameterTypeParams } from '@src/modules/tool/interface/custom-parameter-type.enum';

export class CustomParameterCreateParams {
	@IsString()
	@ApiProperty()
	name!: string;

	@IsString()
	@ApiProperty()
	default?: string;

	@IsString()
	@ApiProperty()
	regex?: string;

	@ApiProperty()
	scope!: CustomParameterScopeParams;

	@ApiProperty()
	location!: CustomParameterLocationParams;

	@ApiProperty()
	type!: CustomParameterTypeParams;
}
