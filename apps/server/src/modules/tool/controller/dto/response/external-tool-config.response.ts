import { ApiProperty } from '@nestjs/swagger';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';

export class ExternalToolConfigResponse {
	@ApiProperty()
	type!: ToolConfigType;

	@ApiProperty()
	baseUrl!: string;
}
