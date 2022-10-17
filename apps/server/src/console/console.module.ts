import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain';
import { ConsoleWriterModule } from '@shared/infra/console/console-writer/console-writer.module';
import { KeycloakModule } from '@shared/infra/identity-management/keycloak/keycloak.module';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { FilesModule } from '@src/modules/files';
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
		ConfigModule.forRoot({
			isGlobal: true,
			validationOptions: { infer: true },
			load: [serverConfig],
		}),
		...((Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean) ? [KeycloakModule] : []),
		MikroOrmModule.forRoot({
			// TODO repeats server module definitions
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,
			allowGlobalContext: true,
			findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
			},
		}),
	],
	providers: [
		/** add console services as providers */
		ServerConsole,
	],
})
export class ServerConsoleModule {}
