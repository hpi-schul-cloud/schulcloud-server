export class UpdateAccountDto {
	public username?: string;

	public password?: string;

	public activated?: boolean;

	constructor(props: UpdateAccountDto) {
		this.username = props.username;
		this.password = props.password;
		this.activated = props.activated;
	}
}
