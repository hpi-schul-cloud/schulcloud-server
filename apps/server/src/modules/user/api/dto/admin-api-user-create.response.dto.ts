import { ApiProperty } from '@nestjs/swagger';

export class AdminApiUserCreateResponse {
	constructor(props: AdminApiUserCreateResponse) {
		this.userId = props.userId;
		this.accountId = props.accountId;
		this.username = props.username;
		this.initialPassword = props.initialPassword;
	}

	@ApiProperty()
	userId: string;

	@ApiProperty()
	accountId: string;

	@ApiProperty()
	username: string;

	@ApiProperty()
	initialPassword: string;
}
