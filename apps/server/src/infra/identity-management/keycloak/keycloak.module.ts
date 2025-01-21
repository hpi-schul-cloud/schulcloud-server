import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EncryptionModule } from '@infra/encryption';
import { LoggerModule } from '@core/logger';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module';
import { KeycloakIdentityManagementOauthService } from './service/keycloak-identity-management-oauth.service';
import { KeycloakIdentityManagementService } from './service/keycloak-identity-management.service';

@Module({
	imports: [LoggerModule, EncryptionModule, HttpModule, KeycloakAdministrationModule],
	providers: [KeycloakIdentityManagementService, KeycloakIdentityManagementOauthService],
	exports: [KeycloakIdentityManagementService, KeycloakIdentityManagementOauthService],
})
export class KeycloakModule {}
