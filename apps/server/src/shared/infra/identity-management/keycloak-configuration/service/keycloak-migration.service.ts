import { Injectable } from '@nestjs/common';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto';

@Injectable()
export class KeycloakMigrationService {
	constructor(private readonly accountService: AccountService) {}

	async migrate(): Promise<[number, string[]]> {
		const amount = 100;
		let skip = 0;
		let foundAccounts = 1;
		let migratedAccounts = 0;
		let accounts: AccountDto[] = [];
		const errorList: string[] = [];
		while (foundAccounts > 0) {
			// eslint-disable-next-line no-await-in-loop
			({ accounts, total: foundAccounts } = await this.accountService.searchByUsernamePartialMatch('', skip, amount));
			foundAccounts = accounts.length;
			for (const account of accounts) {
				// eslint-disable-next-line no-await-in-loop
				const ret = await this.accountService.save(account);
				if (ret.idmReferenceId) {
					migratedAccounts += 1;
				} else {
					errorList.push(`Migration of account ${account.id} failed.`);
				}
			}
			skip += foundAccounts;
		}
		return [migratedAccounts, errorList];
	}
}
