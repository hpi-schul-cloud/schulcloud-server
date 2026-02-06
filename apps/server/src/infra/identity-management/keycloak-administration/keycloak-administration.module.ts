import { ConfigurationModule } from '@infra/configuration';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import { DynamicModule, Module } from '@nestjs/common';
import { KeycloakAdministrationConfig } from './keycloak-administration.config';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';

@Module({})
export class KeycloakAdministrationModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => KeycloakAdministrationConfig
	): DynamicModule {
		return {
			module: KeycloakAdministrationModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			controllers: [],
			providers: [KeycloakAdminClient, KeycloakAdministrationService],
			exports: [KeycloakAdministrationService],
		};
	}
}
