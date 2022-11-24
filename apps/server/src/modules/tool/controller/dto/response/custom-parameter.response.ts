import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomParameterTypeParams } from '../../../interface/custom-parameter-type.enum';
import { CustomParameterLocationParams } from '../../../interface/custom-parameter-location.enum';
import { CustomParameterScopeParams } from '../../../interface/custom-parameter-scope.enum';

export class CustomParameterResponse {
	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	default?: string;

	@ApiPropertyOptional()
	regex?: string;

	@ApiProperty()
	scope: CustomParameterScopeParams;

	@ApiProperty()
	location: CustomParameterLocationParams;

	@ApiProperty()
	type: CustomParameterTypeParams;

	constructor(props: CustomParameterResponse) {
		this.name = props.name;
		this.default = props.default;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
	}
}
