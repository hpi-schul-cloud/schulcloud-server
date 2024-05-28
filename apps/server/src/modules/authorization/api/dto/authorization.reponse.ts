import { ApiProperty } from '@nestjs/swagger';

export class AuthorizedReponse {
	@ApiProperty()
	userId: string;

	@ApiProperty()
	isAuthorized: boolean;

	constructor(props: AuthorizedReponse) {
		this.userId = props.userId;
		this.isAuthorized = props.isAuthorized;
	}
}
