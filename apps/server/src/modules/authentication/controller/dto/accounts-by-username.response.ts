import { PaginationResponse } from '@shared/controller';
import { ApiProperty } from '@nestjs/swagger';
import { Account } from '@shared/domain';

export class AccountsByUsernameResponse {
	constructor(account: Account) {
		this.id = account.id;
		this.username = account.username;
		this.userId = account.user.id;
		this.activated = account.activated ?? false;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	username: string;

	@ApiProperty()
	userId: string;

	@ApiProperty()
	activated: boolean;
}

export class AccountsByUsernameListResponse extends PaginationResponse<AccountsByUsernameResponse[]> {
	constructor(data: AccountsByUsernameResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [AccountsByUsernameResponse] })
	data: AccountsByUsernameResponse[];
}
