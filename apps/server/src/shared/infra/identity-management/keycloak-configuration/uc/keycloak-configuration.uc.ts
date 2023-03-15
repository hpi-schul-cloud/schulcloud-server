import { Injectable } from '@nestjs/common';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KeycloakConfigurationService } from '../service/keycloak-configuration.service';
import { KeycloakSeedService } from '../service/keycloak-seed.service';

@Injectable()
export class KeycloakConfigurationUc {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		private readonly keycloakConfigService: KeycloakConfigurationService,
		private readonly keycloakSeedService: KeycloakSeedService
	) {}

	public async check(): Promise<boolean> {
		return this.kcAdmin.testKcConnection();
	}

	public async clean(): Promise<number> {
		return this.keycloakSeedService.clean();
	}

	public async seed(): Promise<number> {
		return this.keycloakSeedService.seed();
	}

	async configure(): Promise<number> {
		await this.kcAdmin.setPasswordPolicy();
		await this.keycloakConfigService.configureClient();
		await this.keycloakConfigService.configureBrokerFlows();
		await this.keycloakConfigService.configureRealm();
		return this.keycloakConfigService.configureIdentityProviders();
	}
}
