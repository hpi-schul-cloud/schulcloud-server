export class UpdateMyAccountDto {
	public passwordOld!: string;

	public passwordNew?: string;

	public email?: string;

	public firstName?: string;

	public lastName?: string;

	constructor(props: UpdateMyAccountDto) {
		this.passwordOld = props.passwordOld;
		this.passwordNew = props.passwordNew;
		this.email = props.email;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
	}
}
