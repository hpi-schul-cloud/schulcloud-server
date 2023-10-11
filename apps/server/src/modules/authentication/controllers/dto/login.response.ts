import { ApiProperty } from '@nestjs/swagger';

export class LoginResponse {
	@ApiProperty()
	accessToken: string;

	constructor(props: LoginResponse) {
		this.accessToken = props.accessToken;
	}
}
