import { Injectable, Inject } from '@nestjs/common';
import { IKeycloakSettings, KeycloakSettings } from '../interface/keycloak-settings.interface';
import { KeycloakAdminClient } from '../interface/keycloak-admin-client.interface';

@Injectable()
export class KeycloakAdministrationService {
	private lastAuthorizationTime = 0;

	private static AUTHORIZATION_TIMEBOX_MS = 59 * 1000;

	// private kcAdminClient: import('@keycloak/keycloak-admin-client/lib/client.js').KeycloakAdminClient;

	public constructor(
		@Inject(KeycloakSettings) private readonly kcSettings: IKeycloakSettings,
		@Inject(KeycloakAdminClient)
		private readonly kcAdminClient: import('@keycloak/keycloak-admin-client/lib/client.js').KeycloakAdminClient
	) {
		this.kcAdminClient.setConfig({
			baseUrl: kcSettings.baseUrl,
			realmName: kcSettings.realmName,
		});
	}

	public async callKcAdminClient(): Promise<
		import('@keycloak/keycloak-admin-client/lib/client.js').KeycloakAdminClient
	> {
		await this.authorizeAccess();
		return this.kcAdminClient;
	}

	public async testKcConnection(): Promise<boolean> {
		try {
			await this.kcAdminClient.auth(this.kcSettings.credentials);
		} catch (err) {
			return false;
		}
		return true;
	}

	public getAdminUser() {
		return this.kcSettings.credentials.username;
	}

	public async setPasswordPolicy() {
		await this.callKcAdminClient();
		await this.kcAdminClient.realms.update(
			{ realm: this.kcSettings.realmName },
			{ passwordPolicy: 'hashIterations(310000)' }
		);
	}

	private async authorizeAccess() {
		const elapsedTimeMilliseconds = new Date().getTime() - this.lastAuthorizationTime;
		if (elapsedTimeMilliseconds > KeycloakAdministrationService.AUTHORIZATION_TIMEBOX_MS) {
			await this.kcAdminClient.auth(this.kcSettings.credentials);
			this.lastAuthorizationTime = new Date().getTime();
		}
	}
}
