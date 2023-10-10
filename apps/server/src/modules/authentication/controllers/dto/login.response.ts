import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginResponse {
	@ApiProperty()
	accessToken: string;

	@ApiPropertyOptional()
	externalIdToken?: string;

	constructor(props: LoginResponse) {
		this.accessToken = props.accessToken;
		this.externalIdToken = props.externalIdToken;
	}
}
