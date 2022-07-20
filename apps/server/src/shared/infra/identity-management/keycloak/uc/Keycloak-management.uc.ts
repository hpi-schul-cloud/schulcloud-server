import { Injectable } from '@nestjs/common';
import { KeycloakAdministrationService } from '../service/keycloak-administration.service';
import { KeycloakConfigurationService } from '../service/keycloak-configuration.service';
import { KeycloakSeedService } from '../service/keycloak-seed.service';

@Injectable()
export class KeycloakManagementUc {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		private readonly keycloakConfigService: KeycloakConfigurationService,
		private readonly keycloakSeedService: KeycloakSeedService
	) {}

	public async check(): Promise<boolean> {
		return this.kcAdmin.testKcConnection();
	}

	public async clean(): Promise<number> {
		const kc = await this.kcAdmin.callKcAdminClient();
		const adminUser = this.kcAdmin.getAdminUser();
		const users = (await kc.users.find()).filter((user) => user.username !== adminUser);

		// eslint-disable-next-line no-restricted-syntax
		for (const user of users) {
			// eslint-disable-next-line no-await-in-loop
			await kc.users.del({
				// can not be undefined, see filter above
				id: user.id ?? '',
			});
		}
		return users.length;
	}

	async seed(): Promise<number> {
		let userCount = 0;
		const users = await this.keycloakSeedService.loadUsers();
		const accounts = await this.keycloakSeedService.loadAccounts();
		// eslint-disable-next-line no-restricted-syntax
		for (const user of users) {
			const account = accounts.find((a) => a.userId.$oid === user._id.$oid);
			if (account) {
				// eslint-disable-next-line no-await-in-loop
				userCount += (await this.keycloakSeedService.createOrUpdateIdmAccount(account, user)) ? 1 : 0;
			}
		}
		return userCount;
	}

	async configureIdentityProviders(): Promise<number> {
		return this.keycloakConfigService.configureIdentityProviders();
	}
}
