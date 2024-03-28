export class UpdateAccountDto {
	username?: string;

	password?: string;

	activated?: boolean;

	constructor(props: UpdateAccountDto) {
		this.username = props.username;
		this.password = props.password;
		this.activated = props.activated;
	}
}
