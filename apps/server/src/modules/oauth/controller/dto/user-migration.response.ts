export class UserMigrationResponse {
	constructor(props: UserMigrationResponse) {
		this.redirect = props.redirect;
	}

	redirect?: string;
}
