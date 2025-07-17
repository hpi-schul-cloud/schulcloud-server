import { CustomPayload } from '@infra/access-token';
import { ApiProperty } from '@nestjs/swagger';

export class AuthorizedResponse {
	@ApiProperty()
	public userId: string;

	@ApiProperty()
	public isAuthorized: boolean;

	constructor(props: AuthorizedResponse) {
		this.userId = props.userId;
		this.isAuthorized = props.isAuthorized;
	}
}

export class AccessTokenResponse {
	@ApiProperty()
	public token!: string;

	constructor(token: string) {
		this.token = token;
	}
}

export class AccessTokenPayloadResponse {
	@ApiProperty()
	public payload: CustomPayload;

	public ttl: number;

	constructor(props: CustomPayload, ttl: number) {
		this.payload = props;
		this.ttl = ttl;
	}
}
