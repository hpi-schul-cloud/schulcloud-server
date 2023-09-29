import { ApiProperty } from '@nestjs/swagger';

export class AccountResponse {
	constructor({ id, username, userId, activated, updatedAt }: AccountResponse) {
		this.id = id;
		this.username = username;
		this.userId = userId;
		this.activated = activated;
		this.updatedAt = updatedAt;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	username: string;

	@ApiProperty()
	userId?: string;

	@ApiProperty()
	activated?: boolean;

	@ApiProperty()
	updatedAt?: Date;
}
