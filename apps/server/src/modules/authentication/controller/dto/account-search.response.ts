import { ApiProperty } from '@nestjs/swagger';

export class AccountSearchResponse {
	constructor(account: Readonly<AccountSearchResponse>) {
		this.id = account.id;
		this.username = account.username;
		this.userId = account.userId;
		this.activated = account.activated;
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
