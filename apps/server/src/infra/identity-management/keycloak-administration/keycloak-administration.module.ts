import { ConfigurationModule } from '@infra/configuration';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import { Module } from '@nestjs/common';
import { KeycloakAdministrationConfig } from './keycloak-administration-config';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';

@Module({})
export class KeycloakAdministrationModule {
	public static register<T extends KeycloakAdministrationConfig>(injectionToken: string, Constructor: new () => T) {
		return {
			module: KeycloakAdministrationModule,
			imports: [ConfigurationModule.register(injectionToken, Constructor)],
			controllers: [],
			providers: [KeycloakAdminClient, KeycloakAdministrationService],
			exports: [KeycloakAdministrationService],
		};
	}
}
