import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { AccountResponse } from './account.response';

export class AccountSearchListResponse extends PaginationResponse<AccountResponse[]> {
	constructor(data: AccountResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [AccountResponse] })
	data: AccountResponse[];
}
