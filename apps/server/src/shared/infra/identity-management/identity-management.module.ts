import { Module } from '@nestjs/common';
import { IdentityManagementService } from './identity-management.service';
import { KeycloakModule } from './keycloak/keycloak.module';
import { KeycloakIdentityManagementService } from './keycloak/service/keycloak-identity-management.service';

@Module({
	imports: [KeycloakModule],
	providers: [{ provide: IdentityManagementService, useExisting: KeycloakIdentityManagementService }],
	exports: [IdentityManagementService],
})
export class IdentityManagementModule {}
