import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '@src/core/logger';
import { IdentityManagementService } from './identity-management.service';
import { KeycloakModule } from './keycloak/keycloak.module';
import { KeycloakIdentityManagementService } from './keycloak/service/keycloak-identity-management.service';
import { IdentityManagementOathService } from './identity-management-oath.service';
import { KeycloakIdentityManagementOauthService } from './keycloak/service/keycloak-identity-management-oauth.service';

@Module({
	imports: [KeycloakModule, HttpModule, LoggerModule],
	providers: [
		{ provide: IdentityManagementService, useClass: KeycloakIdentityManagementService },
		{ provide: IdentityManagementOathService, useClass: KeycloakIdentityManagementOauthService },
	],
	exports: [IdentityManagementService, IdentityManagementOathService],
})
export class IdentityManagementModule {}
