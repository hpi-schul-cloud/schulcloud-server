import { Module } from '@nestjs/common';
import { KeycloakIdentityManagement } from './keycloak-identity-management';
import { IdentityManagement } from './identity-management';
import { KeycloakModule } from './keycloak';

@Module({
	imports: [KeycloakModule],
	providers: [{ provide: IdentityManagement, useClass: KeycloakIdentityManagement }],
	exports: [IdentityManagement],
})
export class IdentityManagementModule {}
