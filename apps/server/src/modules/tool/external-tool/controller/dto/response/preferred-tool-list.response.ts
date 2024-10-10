import { ApiProperty } from '@nestjs/swagger';
import { PreferredToolResponse } from '@modules/tool/external-tool/controller/dto/response/preferred-tool.response';

export class PreferredToolListResponse {
	@ApiProperty({ type: [PreferredToolResponse] })
	data: PreferredToolResponse[];

	constructor(data: PreferredToolResponse[]) {
		this.data = data;
	}
}
