import { ApiProperty } from '@nestjs/swagger';
import { PublicSystemResponse } from './publicSystemResponse';

export class PublicSystemListResponse {
	@ApiProperty({ type: [PublicSystemResponse] })
	data: PublicSystemResponse[];

	constructor(systemResponses: PublicSystemResponse[]) {
		this.data = systemResponses;
	}
}
