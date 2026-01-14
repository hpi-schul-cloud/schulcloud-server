import { LoggerModule } from '@core/logger';
import { EncryptionConfig, EncryptionModule } from '@infra/encryption';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module';
import { KeycloakIdentityManagementOauthService } from './service/keycloak-identity-management-oauth.service';
import { KeycloakIdentityManagementService } from './service/keycloak-identity-management.service';

@Module({})
export class KeycloakModule {
	public static register<T extends EncryptionConfig>(constructor: new () => T): DynamicModule {
		return {
			module: KeycloakModule,
			imports: [LoggerModule, EncryptionModule.register(constructor), HttpModule, KeycloakAdministrationModule],
			providers: [KeycloakIdentityManagementService, KeycloakIdentityManagementOauthService],
			exports: [KeycloakIdentityManagementService, KeycloakIdentityManagementOauthService],
		};
	}
}
