import { ApiProperty } from '@nestjs/swagger';

export class UserEntity {
	constructor(user: UserEntity) {
		// TODO Builder
		this.userId = user.userId;
		this.username = user.username;
	}
	@ApiProperty()
	userId: string;
	@ApiProperty()
	username: string;
}
