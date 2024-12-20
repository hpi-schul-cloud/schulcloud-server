export class UpdateAccount {
	public username?: string;

	public password?: string;

	public activated?: boolean;

	constructor(props: UpdateAccount) {
		this.username = props.username;
		this.password = props.password;
		this.activated = props.activated;
	}
}
