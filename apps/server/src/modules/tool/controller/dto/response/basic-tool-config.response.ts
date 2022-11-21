import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { ExternalToolConfigResponse } from '@src/modules/tool/controller/dto/response/external-tool-config.response';
import { ApiProperty } from '@nestjs/swagger';

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
