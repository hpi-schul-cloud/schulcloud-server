import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption/encryption.module';
import { LoggerModule } from '@src/core/logger/logger.module';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module';
import { KeycloakIdentityManagementOauthService } from './service/keycloak-identity-management-oauth.service';
import { KeycloakIdentityManagementService } from './service/keycloak-identity-management.service';

@Module({
	imports: [LoggerModule, EncryptionModule, HttpModule, KeycloakAdministrationModule],
	providers: [KeycloakIdentityManagementService, KeycloakIdentityManagementOauthService],
	exports: [KeycloakIdentityManagementService, KeycloakIdentityManagementOauthService],
})
export class KeycloakModule {}
