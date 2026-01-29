import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import { Inject, Injectable } from '@nestjs/common';
import { KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN, KeycloakAdministrationConfig } from '../keycloak-administration.config';

@Injectable()
export class KeycloakAdministrationService {
	private lastAuthorizationTime = 0;

	private static AUTHORIZATION_TIMEBOX_MS = 59 * 1000;

	constructor(
		private readonly kcAdminClient: KeycloakAdminClient,
		@Inject(KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN) private readonly config: KeycloakAdministrationConfig
	) {
		this.kcAdminClient.setConfig({
			baseUrl: this.config.internalBaseUrl,
			realmName: this.config.realmName,
		});
	}

	public async callKcAdminClient(): Promise<KeycloakAdminClient> {
		await this.authorizeAccess();
		return this.kcAdminClient;
	}

	public async testKcConnection(): Promise<boolean> {
		try {
			await this.kcAdminClient.auth(this.config.credentials);
		} catch (err) {
			return false;
		}
		return true;
	}

	public getWellKnownUrl(): string {
		return `${this.config.externalBaseUrl}/realms/${this.config.realmName}/.well-known/openid-configuration`;
	}

	public getAdminUser(): string {
		return this.config.credentials.username;
	}

	public getClientId(): string {
		return this.config.clientId;
	}

	public async getClientSecret(): Promise<string> {
		const kc = await this.callKcAdminClient();
		const clientInternalId = (await kc.clients.find({ clientId: this.config.clientId }))[0]?.id;
		if (clientInternalId) {
			const clientSecret = await kc.clients.getClientSecret({ id: clientInternalId });
			return clientSecret.value ?? '';
		}
		return '';
	}

	public async setPasswordPolicy() {
		const kc = await this.callKcAdminClient();
		await kc.realms.update({ realm: this.config.realmName }, { passwordPolicy: 'hashIterations(310000)' });
	}

	public resetLastAuthorizationTime(): void {
		this.lastAuthorizationTime = 0;
	}

	private async authorizeAccess() {
		const elapsedTimeMilliseconds = new Date().getTime() - this.lastAuthorizationTime;
		if (elapsedTimeMilliseconds > KeycloakAdministrationService.AUTHORIZATION_TIMEBOX_MS) {
			await this.kcAdminClient.auth(this.config.credentials);
			this.lastAuthorizationTime = new Date().getTime();
		}
	}
}
