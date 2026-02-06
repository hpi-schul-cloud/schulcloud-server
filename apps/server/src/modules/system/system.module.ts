import { IdentityManagementModule } from '@infra/identity-management';
import {
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from '@infra/identity-management/keycloak-administration/keycloak-administration.config';
import { Module } from '@nestjs/common';
import { SYSTEM_REPO, SystemService } from './domain';
import { SYSTEM_ENCRYPTION_CONFIG_TOKEN, SystemEncryptionConfig } from './encryption.config';
import { SystemMikroOrmRepo } from './repo/mikro-orm/system.repo';

@Module({
	imports: [
		IdentityManagementModule.register({
			encryptionConfig: {
				configConstructor: SystemEncryptionConfig,
				configInjectionToken: SYSTEM_ENCRYPTION_CONFIG_TOKEN,
			},
			keycloakAdministrationConfig: {
				configConstructor: KeycloakAdministrationConfig,
				configInjectionToken: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
			},
		}),
	],
	providers: [SystemService, { provide: SYSTEM_REPO, useClass: SystemMikroOrmRepo }],
	exports: [SystemService],
})
export class SystemModule {}
