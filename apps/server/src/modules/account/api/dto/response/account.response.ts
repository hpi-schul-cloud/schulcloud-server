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
	public id: string;

	@ApiProperty()
	public username: string;

	@ApiProperty()
	public userId?: string;

	@ApiProperty()
	public activated?: boolean;

	@ApiProperty()
	public updatedAt?: Date;
}
