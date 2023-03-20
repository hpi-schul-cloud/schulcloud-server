export class AccountMigrationInfoDto {
	constructor(accountMigrationInfoDto: AccountMigrationInfoDto) {
		this.amount = accountMigrationInfoDto.amount;
		this.infos = accountMigrationInfoDto.infos;
		this.errors = accountMigrationInfoDto.errors;
	}

	amount: number;

	infos: string[];

	errors: string[];

}
