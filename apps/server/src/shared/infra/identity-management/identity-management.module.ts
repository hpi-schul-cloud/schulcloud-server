import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { IdentityManagementOauthService } from './identity-management-oauth.service';
import { IdentityManagementService } from './identity-management.service';
import { KeycloakModule } from './keycloak/keycloak.module';
import { KeycloakIdentityManagementOauthService } from './keycloak/service/keycloak-identity-management-oauth.service';
import { KeycloakIdentityManagementService } from './keycloak/service/keycloak-identity-management.service';

@Module({
	imports: [forwardRef(() => KeycloakModule), HttpModule],
	providers: [
		{ provide: IdentityManagementService, useClass: KeycloakIdentityManagementService },
		{ provide: IdentityManagementOauthService, useClass: KeycloakIdentityManagementOauthService },
	],
	exports: [IdentityManagementService, IdentityManagementOauthService],
})
export class IdentityManagementModule {}
