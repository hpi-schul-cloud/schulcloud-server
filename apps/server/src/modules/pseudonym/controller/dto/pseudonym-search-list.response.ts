import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { PseudonymResponse } from './pseudonym.response';

export class PseudonymSearchListResponse extends PaginationResponse<PseudonymResponse[]> {
	@ApiProperty()
	data: PseudonymResponse[];

	constructor(data: PseudonymResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}
}
