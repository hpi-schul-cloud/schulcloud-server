import { LoggerModule } from '@core/logger';
import { EncryptionModule } from '@infra/encryption';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
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
		const { encryptionConfig, keycloakAdministrationConfig } = options;
		return {
			module: IdentityManagementModule,
			imports: [
				KeycloakModule.register({
					encryptionConfig,
					keycloakAdministrationConfig,
				}),
				KeycloakAdministrationModule.register(
					keycloakAdministrationConfig.configInjectionToken,
					keycloakAdministrationConfig.configConstructor
				),
				HttpModule,
				EncryptionModule.register(encryptionConfig.configInjectionToken, encryptionConfig.configConstructor),
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
