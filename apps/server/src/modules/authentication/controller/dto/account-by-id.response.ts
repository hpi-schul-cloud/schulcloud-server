import { ApiProperty } from '@nestjs/swagger';
import { Account } from '@shared/domain';

export class AccountByIdResponse {
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
