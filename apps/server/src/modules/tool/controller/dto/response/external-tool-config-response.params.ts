import { ApiProperty } from '@nestjs/swagger';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';

export class ExternalToolConfigResponseParams {
	constructor(props: ExternalToolConfigResponseParams) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}

	@ApiProperty()
	type: ToolConfigType;

	@ApiProperty()
	baseUrl: string;
}
