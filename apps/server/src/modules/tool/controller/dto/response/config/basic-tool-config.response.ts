import { ApiProperty } from '@nestjs/swagger';
import { ToolConfigType } from '../../../../interface';
import { ExternalToolConfigResponse } from './external-tool-config.response';

export class BasicToolConfigResponse extends ExternalToolConfigResponse {
	@ApiProperty()
	type: ToolConfigType;

	@ApiProperty()
	baseUrl: string;

	constructor(props: BasicToolConfigResponse) {
		super();
		this.type = ToolConfigType.BASIC;
		this.baseUrl = props.baseUrl;
	}
}
