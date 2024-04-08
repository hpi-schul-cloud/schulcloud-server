export class UpdateAccount {
	username?: string;

	password?: string;

	activated?: boolean;

	constructor(props: UpdateAccount) {
		this.username = props.username;
		this.password = props.password;
		this.activated = props.activated;
	}
}
