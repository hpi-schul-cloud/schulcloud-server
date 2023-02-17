export class UserMigrationDto {
	constructor(userMigrationDto: UserMigrationDto) {
		this.redirect = userMigrationDto.redirect;
	}

	redirect?: string;
}
