export class MigrationDto {
	redirect?: string;

	constructor(userMigrationDto: MigrationDto) {
		this.redirect = userMigrationDto.redirect;
	}
}
