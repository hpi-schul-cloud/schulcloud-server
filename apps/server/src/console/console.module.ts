import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain';
import { ConsoleWriterModule } from '@shared/infra/console/console-writer/console-writer.module';
import { KeycloakModule } from '@shared/infra/identity-management/keycloak/keycloak.module';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { FilesModule } from '@src/modules/files';
import { FileRecord } from '@src/modules/files-storage/entity';
import { H5PEditorModule } from '@src/modules/h5p-editor';
import { ManagementModule } from '@src/modules/management/management.module';
import { serverConfig } from '@src/modules/server';
import { ConsoleModule } from 'nestjs-console';
import { ServerConsole } from './server.console';

@Module({
	imports: [
		ManagementModule,
		ConsoleModule,
		ConsoleWriterModule,
		FilesModule,
		H5PEditorModule,
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
		...((Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean) ? [KeycloakModule] : []),
		MikroOrmModule.forRoot({
			// TODO repeats server module definitions
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [...ALL_ENTITIES, FileRecord],
			allowGlobalContext: true,
			findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
				new NotFoundException(`The requested ${entityName}: ${JSON.stringify(where)} has not been found.`),
		}),
	],
	providers: [
		/** add console services as providers */
		ServerConsole,
	],
})
export class ServerConsoleModule {}
