export class UpdateMyAccount {
	passwordOld!: string;

	passwordNew?: string;

	email?: string;

	firstName?: string;

	lastName?: string;

	constructor(props: UpdateMyAccount) {
		this.passwordOld = props.passwordOld;
		this.passwordNew = props.passwordNew;
		this.email = props.email;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
	}
}
