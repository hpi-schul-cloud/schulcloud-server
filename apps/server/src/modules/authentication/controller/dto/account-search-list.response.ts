import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { AccountSearchResponse } from './account-search.response';

export class AccountSearchListResponse extends PaginationResponse<AccountSearchResponse[]> {
	constructor(data: AccountSearchResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [AccountSearchResponse] })
	data: AccountSearchResponse[];
}
