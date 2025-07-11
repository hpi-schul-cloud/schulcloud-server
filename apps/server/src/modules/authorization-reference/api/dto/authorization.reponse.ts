import { CustomPayload } from '@infra/access-token';
import { ApiProperty } from '@nestjs/swagger';

export class AuthorizedResponse {
	@ApiProperty()
	userId: string;

	@ApiProperty()
	isAuthorized: boolean;

	constructor(props: AuthorizedResponse) {
		this.userId = props.userId;
		this.isAuthorized = props.isAuthorized;
	}
}

export class AccessTokenResponse {
	@ApiProperty()
	token!: string;

	constructor(token: string) {
		this.token = token;
	}
}

export class AccessTokenPayloadResponse {
	@ApiProperty()
	payload: CustomPayload;

	constructor(props: CustomPayload) {
		this.payload = props;
	}
}
