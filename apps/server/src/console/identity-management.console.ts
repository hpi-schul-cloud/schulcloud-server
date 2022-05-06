import { Command, Console } from 'nestjs-console';
import { ConsoleWriterService } from '@shared/infra/console';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { Inject } from '@nestjs/common';
import fs from 'node:fs/promises';
import {
	IJsonAccount,
	IKeycloakSettings,
	IJsonUser,
	KeycloakSettings,
} from '@shared/infra/identity-management/keycloak';

@Console({ command: 'idm', description: 'Prefixes all Keycloak related console commands.' })
export class IdentityManagementConsole {
	constructor(
		private readonly console: ConsoleWriterService,
		private readonly client: KeycloakAdminClient,
		@Inject(KeycloakSettings) private readonly settings: IKeycloakSettings
	) {}

	@Command({ command: 'check' })
	async check(): Promise<void> {
		this.console.info(JSON.stringify(this.settings, null, 4));
		this.client.setConfig({
			baseUrl: this.settings.baseUrl,
			realmName: this.settings.realmName,
		});

		try {
			await this.client.auth(this.settings.credentials);
			this.console.info('Connected to Keycloak');
		} catch {
			throw new Error('Keycloak is not reachable or authentication failed');
		}
	}

	@Command({ command: 'clean' })
	async clean(): Promise<void> {
		await this.check();
		const users = (await this.client.users.find()).filter(
			(user) => user.username !== this.settings.credentials.username
		);
		// eslint-disable-next-line no-restricted-syntax
		for (const user of users) {
			// eslint-disable-next-line no-await-in-loop
			await this.client.users.del({
				realm: this.settings.realmName,
				id: user.id ?? '',
			});
		}
		this.console.info(`Cleaned ${users.length} users from Keycloak`);
	}

	@Command({ command: 'seed' })
	async seed(): Promise<void> {
		await this.check();
		let userCount = 0;
		const users = await this.loadUsers();
		const accounts = await this.loadAccounts();
		// eslint-disable-next-line no-restricted-syntax
		for (const user of users) {
			const account = accounts.find((a) => a.userId.$oid === user._id.$oid);
			if (account) {
				// eslint-disable-next-line no-await-in-loop
				await this.client.users.create({
					realm: this.settings.realmName,
					username: account.username,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					enabled: true,
					credentials: [
						{
							type: 'password',
							secretData: `{"value": "${account.password}", "salt": "", "additionalParameters": {}}`,
							credentialData: '{ "hashIterations": 10, "algorithm": "bcrypt", "additionalParameters": {}}',
						},
					],
				});
				userCount += 1;
			}
		}
		this.console.info(`Seeded ${userCount} users into Keycloak`);
	}

	private async loadAccounts(): Promise<IJsonAccount[]> {
		const data = await fs.readFile('./backup/setup/accounts.json', { encoding: 'utf-8' });
		return JSON.parse(data) as IJsonAccount[];
	}

	private async loadUsers(): Promise<IJsonUser[]> {
		const data = await fs.readFile('./backup/setup/users.json', { encoding: 'utf-8' });
		return JSON.parse(data) as IJsonUser[];
	}
}
