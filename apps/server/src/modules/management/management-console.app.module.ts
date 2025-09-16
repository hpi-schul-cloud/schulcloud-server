import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConsoleWriterModule } from '@infra/console/console-writer/console-writer.module';
import { KeycloakModule } from '@infra/identity-management/keycloak/keycloak.module';
import { SyncModule } from '@infra/sync/sync.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FilesModule } from '@modules/files';
import { ManagementModule } from '@modules/management/management.module';
import { serverConfig } from '@modules/server';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { ConsoleModule } from 'nestjs-console';
import mikroOrmCliConfig from './mikro-orm-cli.config';
import { ErrorModule } from '@core/error';

@Module({
	imports: [
		ManagementModule,
		ConsoleModule,
		ConsoleWriterModule,
		FilesModule,
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
		...((Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean) ? [KeycloakModule] : []), // TODO: Was macht das KeycloakModule hier?
		MikroOrmModule.forRoot(mikroOrmCliConfig),
		SyncModule,
		ErrorModule,
	],
	providers: [],
})
export class ManagementConsoleModule {}
