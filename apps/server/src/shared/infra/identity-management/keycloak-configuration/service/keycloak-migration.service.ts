import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { AccountDto } from '@src/modules/account/services/dto';
import { AccountService } from '@src/modules/account/services/account.service';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';

@Injectable()
export class KeycloakMigrationService {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		private readonly accountService: AccountService,
		private readonly logger: Logger
	) {
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
				try {
					// eslint-disable-next-line no-await-in-loop
					const retAccountId = await this.createOrUpdateIdmAccount(account);
					migratedAccounts += 1;
					if (verbose) {
						this.logger.log(`Migration of account ${account.id} done, new id is ${retAccountId}.`);
					}
				} catch (err) {
					this.logger.error(`Migration of account ${account.id} failed.`, err);
				}
			}
			skip += foundAccounts;
			if (!verbose) {
				this.logger.log(`...migrated ${skip} accounts.`);
			}
		}
		return migratedAccounts;
	}

	private async createOrUpdateIdmAccount(account: AccountDto): Promise<string> {
		const idmUserRepresentation: UserRepresentation = {
			username: account.username,
			enabled: true,
			credentials: [
				{
					type: 'password',
					secretData: `{"value": "${account.password ?? ''}", "salt": "", "additionalParameters": {}}`,
					credentialData: '{ "hashIterations": 10, "algorithm": "bcrypt", "additionalParameters": {}}',
				},
			],
			attributes: {
				refTechnicalId: account.id,
				refFunctionalIntId: account.userId,
				refFunctionalExtId: account.systemId,
			},
		};
		const kc = await this.kcAdmin.callKcAdminClient();
		const existingAccounts = await kc.users.find({ username: account.username, exact: true });
		if (existingAccounts.length === 1 && existingAccounts[0].id) {
			const existingAccountId = existingAccounts[0].id;
			await kc.users.update({ id: existingAccountId }, idmUserRepresentation);
			return existingAccountId;
		}
		if (existingAccounts.length === 0) {
			const createdAccountId = await kc.users.create(idmUserRepresentation);
			return createdAccountId.id;
		}
		throw Error(`Duplicate username ${account.username} update operation aborted.`);
	}
}
