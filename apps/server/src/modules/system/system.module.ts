import {
	IDENTITY_MANAGEMENT_CONFIG_TOKEN,
	IdentityManagementConfig,
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from '@infra/identity-management';
import { IdentityManagementModule } from '@infra/identity-management/identity-management.module';
import { Module } from '@nestjs/common';
import { SYSTEM_REPO, SystemService } from './domain';
import { SYSTEM_ENCRYPTION_CONFIG_TOKEN, SystemEncryptionConfig } from './encryption.config';
import { SystemMikroOrmRepo } from './repo/mikro-orm/system.repo';

@Module({
	imports: [
		IdentityManagementModule.register({
			encryptionConfig: { Constructor: SystemEncryptionConfig, injectionToken: SYSTEM_ENCRYPTION_CONFIG_TOKEN },
			identityManagementConfig: {
				Constructor: IdentityManagementConfig,
				injectionToken: IDENTITY_MANAGEMENT_CONFIG_TOKEN,
			},
			keycloakAdministrationConfig: {
				Constructor: KeycloakAdministrationConfig,
				injectionToken: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
			},
		}),
	],
	providers: [SystemService, { provide: SYSTEM_REPO, useClass: SystemMikroOrmRepo }],
	exports: [SystemService],
})
export class SystemModule {}
