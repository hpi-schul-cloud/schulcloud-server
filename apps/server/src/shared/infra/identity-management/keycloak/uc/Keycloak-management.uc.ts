import { Injectable } from '@nestjs/common';
import { KeycloakAdministrationService } from '../service/keycloak-administration.service';
import { KeycloakConfigurationService } from '../service/keycloak-configuration.service';
import { KeycloakSeedService } from '../service/keycloak-seed.service';

@Injectable()
export class KeycloakManagementUc {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		private readonly keycloakConfigService: KeycloakConfigurationService,
		private readonly keycloakSeedService: KeycloakSeedService,
		private readonly keycloakAdministrationService: KeycloakAdministrationService
	) {}

	public async check(): Promise<boolean> {
		return this.kcAdmin.testKcConnection();
	}

	public clean(): Promise<number> {
		return this.keycloakSeedService.clean();
	}

	public seed(): Promise<number> {
		return this.keycloakSeedService.seed();
	}

	async configure(loadFromJson = false): Promise<number> {
		await this.keycloakAdministrationService.setPasswordPolicy();
		return this.keycloakConfigService.configureIdentityProviders(loadFromJson);
	}
}
