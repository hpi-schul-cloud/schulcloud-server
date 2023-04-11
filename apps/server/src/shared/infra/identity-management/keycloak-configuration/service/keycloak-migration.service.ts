import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto';

@Injectable()
export class KeycloakMigrationService {
	constructor(private readonly accountService: AccountService, private readonly logger: Logger) {
		this.logger.setContext(KeycloakMigrationService.name);
	}

	async migrate(start = 0, verbose = false): Promise<number> {
		const amount = 100;
		let skip = start;
		let foundAccounts = 1;
		let migratedAccounts = 0;
		let accounts: AccountDto[] = [];
		while (foundAccounts > 0) {
			// eslint-disable-next-line no-await-in-loop
			accounts = await this.accountService.findMany(skip, amount);
			foundAccounts = accounts.length;
			for (const account of accounts) {
				// eslint-disable-next-line no-await-in-loop
				const ret = await this.accountService.save(account);
				if (ret.idmReferenceId) {
					migratedAccounts += 1;
					if (verbose) {
						this.logger.log(`Migration of account ${account.id} done, new id is ${ret.idmReferenceId}.`);
					}
				} else {
					this.logger.error(`Migration of account ${account.id} failed.`);
				}
			}
			skip += foundAccounts;
			if (!verbose) {
				this.logger.log(`...migrated ${skip} accounts.`);
			}
		}
		return migratedAccounts;
	}
}
