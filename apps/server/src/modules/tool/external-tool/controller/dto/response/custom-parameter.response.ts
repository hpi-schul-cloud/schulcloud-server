import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	CustomParameterLocationParams,
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
} from '../../../../common/enum';

export class CustomParameterResponse {
	@ApiProperty({ description: 'Technical name of the parameter that is send to the tool provider.' })
	public name: string;

	@ApiProperty({ description: 'Display name that is shown in the user interface.' })
	public displayName: string;

	@ApiPropertyOptional({ description: 'Additional description of the parameter in the user interface.' })
	public description?: string;

	@ApiPropertyOptional({ description: 'Pre-fill value for the parameter. Required for global parameters.' })
	public defaultValue?: string;

	@ApiPropertyOptional({ description: 'Regular expression to limit user input for this field.' })
	public regex?: string;

	@ApiPropertyOptional({ description: 'A description for the regex.' })
	public regexComment?: string;

	@ApiProperty({
		enum: CustomParameterScopeTypeParams,
		enumName: 'CustomParameterScopeTypeParams',
		description: 'Scope where the parameter has to be configured.',
		example: CustomParameterScopeTypeParams.SCHOOL,
	})
	public scope: CustomParameterScopeTypeParams;

	@ApiProperty({
		enum: CustomParameterLocationParams,
		enumName: 'CustomParameterLocationParams',
		description: 'Location where the parameter is transmitted in the HTTP request to the tool provider.',
		example: CustomParameterLocationParams.QUERY,
	})
	public location: CustomParameterLocationParams;

	@ApiProperty({
		enum: CustomParameterTypeParams,
		enumName: 'CustomParameterTypeParams',
		description: 'Input field type. Auto parameters have to be global and cannot have a defaultValue.',
		example: CustomParameterTypeParams.BOOLEAN,
	})
	public type: CustomParameterTypeParams;

	@ApiProperty({ description: 'If true, the parameter does not have to be filled out during configuration.' })
	public isOptional: boolean;

	@ApiProperty({ description: 'If true, the parameter value is not copied to other contexts.' })
	public isProtected: boolean;

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
