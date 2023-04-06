import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import { Module } from '@nestjs/common';
import { KeycloakSettings } from './interface/keycloak-settings.interface';
import KeycloakConfiguration from './keycloak-config';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';

@Module({
	controllers: [],
	providers: [
		KeycloakAdminClient,
		{
			provide: KeycloakSettings,
			useValue: KeycloakConfiguration.keycloakSettings,
		},
		KeycloakAdministrationService,
	],
	exports: [KeycloakAdministrationService],
})
export class KeycloakAdministrationModule {}
