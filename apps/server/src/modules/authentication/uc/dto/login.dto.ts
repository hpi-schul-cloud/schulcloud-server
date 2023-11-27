export class LoginDto {
	accessToken: string;

	constructor(props: LoginDto) {
		this.accessToken = props.accessToken;
	}
}
