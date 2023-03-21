import { Injectable } from '@nestjs/common';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountMigrationInfoDto } from '../dto/account-migration-info.dto';

@Injectable()
export class KeycloakMigrationService {
	constructor(private readonly accountService: AccountService) {}

	async migrate(start = 0, userNamePattern = ''): Promise<AccountMigrationInfoDto> {
		const amount = 100;
		const infos: string[] = [];
		const errors: string[] = [];
		const { accounts } = await this.accountService.searchByUsernamePartialMatch(userNamePattern, start, amount);
		for (const account of accounts) {
			// eslint-disable-next-line no-await-in-loop
			const ret = await this.accountService.save(account);
			if (ret.idmReferenceId) {
				infos.push(`Migration of account ${account.id} done, new id is ${ret.idmReferenceId}.`);
			} else {
				errors.push(`Migration of account ${account.id} failed.`);
			}
		}
		return { amount: accounts.length, infos, errors };
	}
}
