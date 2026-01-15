import { LoggerModule } from '@core/logger';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { EncryptionConfig, EncryptionModule } from '../encryption';
import { IdentityManagementOauthService } from './identity-management-oauth.service';
import { IdentityManagementService } from './identity-management.service';
import { KeycloakAdministrationModule } from './keycloak-administration/keycloak-administration.module';
import { KeycloakModule } from './keycloak/keycloak.module';
import { KeycloakIdentityManagementOauthService } from './keycloak/service/keycloak-identity-management-oauth.service';
import { KeycloakIdentityManagementService } from './keycloak/service/keycloak-identity-management.service';

@Module({})
export class IdentityManagementModule {
	public static register<T extends EncryptionConfig>(
		constructor: new () => T,
		configInjectionToken: string
	): DynamicModule {
		return {
			module: IdentityManagementModule,
			imports: [
				KeycloakModule.register(constructor, configInjectionToken),
				KeycloakAdministrationModule,
				HttpModule,
				EncryptionModule.register(constructor, configInjectionToken),
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
