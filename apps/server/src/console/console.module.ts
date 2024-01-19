import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConsoleWriterModule } from '@infra/console/console-writer/console-writer.module';
import { KeycloakModule } from '@infra/identity-management/keycloak/keycloak.module';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FilesModule } from '@modules/files';
import { FileRecord } from '@modules/files-storage/entity';
import { FileEntity } from '@modules/files/entity';
import { ManagementModule } from '@modules/management/management.module';
import { serverConfig } from '@modules/server';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { ConsoleModule } from 'nestjs-console';
import { ServerConsole } from './server.console';

@Module({
	imports: [
		ManagementModule,
		ConsoleModule,
		ConsoleWriterModule,
		FilesModule,
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
		...((Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean) ? [KeycloakModule] : []),
		MikroOrmModule.forRoot({
			// TODO repeats server module definitions
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [...ALL_ENTITIES, FileEntity, FileRecord],
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
