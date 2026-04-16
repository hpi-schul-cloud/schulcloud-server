import { ConsoleWriterModule } from '@infra/console/console-writer/console-writer.module';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import {
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from '@infra/identity-management/keycloak-administration/keycloak-administration.config';
import { KeycloakModule } from '@infra/identity-management/keycloak/keycloak.module';
import { SyncModule } from '@infra/sync/sync.module';
import { FilesModule } from '@modules/files';
import { ManagementModule } from '@modules/management/management.module';
import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { MANAGMENT_ENCRYPTION_CONFIG_TOKEN, ManagmentEncryptionConfig } from './encryption.config';
import { ENTITIES } from './management.entity.imports';
import migrationOptions from './migrations-options';

@Module({
	imports: [
		ManagementModule,
		ConsoleModule,
		ConsoleWriterModule,
		FilesModule,
		KeycloakModule.register({
			encryptionConfig: {
				configConstructor: ManagmentEncryptionConfig,
				configInjectionToken: MANAGMENT_ENCRYPTION_CONFIG_TOKEN,
			},
			keycloakAdministrationConfig: {
				configConstructor: KeycloakAdministrationConfig,
				configInjectionToken: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
			}, // TODO: Was macht das KeycloakModule hier?
		}),
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
			migrationOptions,
		}),
		SyncModule,
	],
	providers: [],
})
export class ManagementConsoleModule {}
