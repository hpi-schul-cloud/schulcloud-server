import { LoggerModule } from '@core/logger';
import { EncryptionModule } from '@infra/encryption';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module';
import { KeycloakIdentityManagementOauthService } from './service/keycloak-identity-management-oauth.service';
import { KeycloakIdentityManagementService } from './service/keycloak-identity-management.service';
import { KeycloakModuleOptions } from './types';

@Module({})
export class KeycloakModule {
	public static register(options: KeycloakModuleOptions): DynamicModule {
		const { encryptionConfig, keycloakAdministrationConfig } = options;

		return {
			module: KeycloakModule,
			imports: [
				LoggerModule,
				EncryptionModule.register(encryptionConfig.configInjectionToken, encryptionConfig.configConstructor),
				HttpModule,
				KeycloakAdministrationModule.register(
					keycloakAdministrationConfig.configInjectionToken,
					keycloakAdministrationConfig.configConstructor
				),
			],
			providers: [KeycloakIdentityManagementService, KeycloakIdentityManagementOauthService],
			exports: [KeycloakIdentityManagementService, KeycloakIdentityManagementOauthService],
		};
	}
}
