import { ApiProperty } from '@nestjs/swagger';
import { ReleaseItemResponse } from './release-item.response';

export class ReleaseListResponse {
	constructor(data: ReleaseItemResponse[]) {
		this.data = data;
	}

	@ApiProperty({ type: [ReleaseItemResponse] })
	data: ReleaseItemResponse[];
}
