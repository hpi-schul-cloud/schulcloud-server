import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption';
import { LoggerModule } from '@src/core/logger';
import { KeycloakManagementModule } from '../keycloak-management/keycloak-management.module';
import { KeycloakIdentityManagementOauthService } from './service/keycloak-identity-management-oauth.service';
import { KeycloakIdentityManagementService } from './service/keycloak-identity-management.service';

@Module({
	imports: [LoggerModule, EncryptionModule, HttpModule, KeycloakManagementModule],
	providers: [KeycloakIdentityManagementService, KeycloakIdentityManagementOauthService],
	exports: [KeycloakIdentityManagementService, KeycloakIdentityManagementOauthService],
})
export class KeycloakModule {}
