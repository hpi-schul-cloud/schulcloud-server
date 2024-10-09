import { ApiProperty } from '@nestjs/swagger';
import { PreferedToolResponse } from '@modules/tool/external-tool/controller/dto/response/prefered-tool.response';

export class PreferedToolListResponse {
	@ApiProperty({ type: [PreferedToolResponse] })
	data: PreferedToolResponse[];

	constructor(data: PreferedToolResponse[]) {
		this.data = data;
	}
}
