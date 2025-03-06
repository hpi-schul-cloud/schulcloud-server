import { ApiProperty } from '@nestjs/swagger';
import { ToolConfigType } from '../../../../../common/enum';
import { ExternalToolConfigResponse } from './external-tool-config.response';

export class BasicToolConfigResponse extends ExternalToolConfigResponse {
	@ApiProperty({
		enum: ToolConfigType,
		enumName: 'ToolConfigType',
		description: 'Configuration type of the tool.',
		example: ToolConfigType.BASIC,
	})
	public type: ToolConfigType;

	@ApiProperty({
		description:
			'Defines the target URL that is launched. Can be automatically filled with parameter values when using : in-front of the parameter name.',
		example: 'https://example.com/:parameter1/test',
	})
	public baseUrl: string;

	constructor(props: BasicToolConfigResponse) {
		super();
		this.type = ToolConfigType.BASIC;
		this.baseUrl = props.baseUrl;
	}
}
