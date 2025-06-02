import { ApiProperty } from '@nestjs/swagger';

export class OAuthSessionTokenExpirationResponse {
	@ApiProperty({ type: Date })
	expiresAt: Date;

	constructor(props: OAuthSessionTokenExpirationResponse) {
		this.expiresAt = props.expiresAt;
	}
}
