import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { EncryptionModule } from '../encryption';
import { IdentityManagementOauthService } from './identity-management-oauth.service';
import { IdentityManagementService } from './identity-management.service';
import { KeycloakAdministrationModule } from './keycloak-administration/keycloak-administration.module';
import { KeycloakModule } from './keycloak/keycloak.module';
import { KeycloakIdentityManagementOauthService } from './keycloak/service/keycloak-identity-management-oauth.service';
import { KeycloakIdentityManagementService } from './keycloak/service/keycloak-identity-management.service';

@Module({
	imports: [KeycloakModule, KeycloakAdministrationModule, HttpModule, EncryptionModule, LoggerModule],
	providers: [
		{ provide: IdentityManagementService, useClass: KeycloakIdentityManagementService },
		{ provide: IdentityManagementOauthService, useClass: KeycloakIdentityManagementOauthService },
	],
	exports: [IdentityManagementService, IdentityManagementOauthService],
})
export class IdentityManagementModule {}
