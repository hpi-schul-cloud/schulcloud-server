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
import { serverConfig } from '@modules/server';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { ConsoleModule } from 'nestjs-console';
import { MANAGMENT_ENCRYPTION_CONFIG_TOKEN, ManagmentEncryptionConfig } from './encryption.config';
import { ENTITIES } from './management.entity.imports';
import migrationOptions from './mikro-orm-cli.config';

@Module({
	imports: [
		ManagementModule,
		ConsoleModule,
		ConsoleWriterModule,
		FilesModule,
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
		KeycloakModule.register({
			encryptionConfig: {
				Constructor: ManagmentEncryptionConfig,
				injectionToken: MANAGMENT_ENCRYPTION_CONFIG_TOKEN,
			},
			keycloakAdministrationConfig: {
				Constructor: KeycloakAdministrationConfig,
				injectionToken: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
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
