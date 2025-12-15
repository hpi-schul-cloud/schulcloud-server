import { ApiProperty } from '@nestjs/swagger';
import { RuntimeConfigListItemResponse } from './runtime-config-list-item.response';

export class RuntimeConfigListResponse {
	constructor({ data }: RuntimeConfigListResponse) {
		this.data = data;
	}

	@ApiProperty({ type: [RuntimeConfigListItemResponse] })
	public data: RuntimeConfigListItemResponse[];
}
