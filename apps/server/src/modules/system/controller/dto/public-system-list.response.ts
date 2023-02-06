import { ApiProperty } from '@nestjs/swagger';
import { PublicSystemResponse } from './public-system-response';

export class PublicSystemListResponse {
	@ApiProperty({ type: [PublicSystemResponse] })
	data: PublicSystemResponse[];

	constructor(systemResponses: PublicSystemResponse[]) {
		this.data = systemResponses;
	}
}
