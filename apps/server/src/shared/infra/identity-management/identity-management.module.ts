import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IdentityManagementService } from './identity-management.service';
import { KeycloakModule } from './keycloak/keycloak.module';
import { KeycloakIdentityManagementService } from './keycloak/service/keycloak-identity-management.service';
import { IdentityManagementOauthService } from './identity-management-oauth.service';
import { KeycloakIdentityManagementOauthService } from './keycloak/service/keycloak-identity-management-oauth.service';

@Module({
	imports: [KeycloakModule, HttpModule],
	providers: [
		{ provide: IdentityManagementService, useClass: KeycloakIdentityManagementService },
		{ provide: IdentityManagementOauthService, useClass: KeycloakIdentityManagementOauthService },
	],
	exports: [IdentityManagementService, IdentityManagementOauthService],
})
export class IdentityManagementModule {}
