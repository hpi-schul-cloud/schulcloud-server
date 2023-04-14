export class UserMigrationResponse {
	redirect: string;

	// TODO: N21-632 - Remove client redirects
	constructor(props: UserMigrationResponse) {
		this.redirect = props.redirect;
	}
}
