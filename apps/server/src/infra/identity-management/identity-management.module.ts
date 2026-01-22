import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { EncryptionModule } from '../encryption';
import { IdentityManagementOauthService } from './identity-management-oauth.service';
import { IdentityManagementService } from './identity-management.service';
import { KeycloakAdministrationModule } from './keycloak-administration/keycloak-administration.module';
import { KeycloakModule } from './keycloak/keycloak.module';
import { KeycloakIdentityManagementOauthService } from './keycloak/service/keycloak-identity-management-oauth.service';
import { KeycloakIdentityManagementService } from './keycloak/service/keycloak-identity-management.service';
import { IdentityManagementModuleOptions } from './types';

@Module({})
export class IdentityManagementModule {
	public static register(options: IdentityManagementModuleOptions): DynamicModule {
		const { encryptionConfig, identityManagementConfig, keycloakAdministrationConfig } = options;
		return {
			module: IdentityManagementModule,
			imports: [
				ConfigurationModule.register(identityManagementConfig.injectionToken, identityManagementConfig.Constructor),
				KeycloakModule.register(encryptionConfig.Constructor, encryptionConfig.injectionToken),
				KeycloakAdministrationModule.register(
					keycloakAdministrationConfig.injectionToken,
					keycloakAdministrationConfig.Constructor
				),
				HttpModule,
				EncryptionModule.register(encryptionConfig.Constructor, encryptionConfig.injectionToken),
				LoggerModule,
			],
			providers: [
				{ provide: IdentityManagementService, useClass: KeycloakIdentityManagementService },
				{ provide: IdentityManagementOauthService, useClass: KeycloakIdentityManagementOauthService },
			],
			exports: [IdentityManagementService, IdentityManagementOauthService],
		};
	}
}
