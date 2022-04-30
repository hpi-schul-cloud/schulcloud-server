import { ApiProperty } from '@nestjs/swagger';

export class AccountResponse {
	constructor({ id, username, userId, activated }: AccountResponse) {
		this.id = id;
		this.username = username;
		this.userId = userId;
		this.activated = activated;
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
