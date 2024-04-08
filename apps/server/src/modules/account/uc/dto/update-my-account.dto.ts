export class UpdateMyAccountDto {
	passwordOld!: string;

	passwordNew?: string;

	email?: string;

	firstName?: string;

	lastName?: string;

	constructor(props: UpdateMyAccountDto) {
		this.passwordOld = props.passwordOld;
		this.passwordNew = props.passwordNew;
		this.email = props.email;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
	}
}
