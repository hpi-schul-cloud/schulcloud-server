import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	CustomParameterLocationParams,
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
} from '../../../../common/enum';

export class CustomParameterResponse {
	@ApiProperty()
	name: string;

	@ApiProperty()
	displayName: string;

	@ApiPropertyOptional()
	description?: string;

	@ApiPropertyOptional()
	defaultValue?: string;

	@ApiPropertyOptional()
	regex?: string;

	@ApiPropertyOptional()
	regexComment?: string;

	@ApiProperty({ enum: CustomParameterScopeTypeParams })
	scope: CustomParameterScopeTypeParams;

	@ApiProperty({ enum: CustomParameterLocationParams })
	location: CustomParameterLocationParams;

	@ApiProperty({ enum: CustomParameterTypeParams })
	type: CustomParameterTypeParams;

	@ApiProperty()
	isOptional: boolean;

	@ApiProperty()
	isProtected: boolean;

	constructor(props: CustomParameterResponse) {
		this.name = props.name;
		this.displayName = props.displayName;
		this.description = props.description;
		this.defaultValue = props.defaultValue;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
		this.regexComment = props.regexComment;
		this.isOptional = props.isOptional;
		this.isProtected = props.isProtected;
	}
}
