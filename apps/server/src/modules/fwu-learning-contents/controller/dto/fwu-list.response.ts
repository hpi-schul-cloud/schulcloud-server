import { ApiProperty } from '@nestjs/swagger';
import { FwuItemResponse } from './fwu-item.response';

export class FwuListResponse {
	@ApiProperty({ type: [FwuItemResponse] })
	data: FwuItemResponse[];

	constructor(data: FwuItemResponse[]) {
		this.data = data;
	}
}
