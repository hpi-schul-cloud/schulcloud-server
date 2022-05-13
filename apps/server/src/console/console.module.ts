import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsoleWriterModule } from '@shared/infra/console/console-writer/console-writer.module';
// TODO Have generic/abstract IDM Module Console
import { KeycloakModule } from '@shared/infra/identity-management/keycloak/keycloak.module';
import { FilesModule } from '@src/modules/files';
import { ManagementModule } from '@src/modules/management/management.module';
import serverConfig from '@src/server.config';
import { ConsoleModule } from 'nestjs-console';
import { ServerConsole } from './server.console';

const baseImports = [
	ManagementModule,
	ConsoleModule,
	ConsoleWriterModule,
	FilesModule,
	ConfigModule.forRoot({
		isGlobal: true,
		validationOptions: { infer: true },
		load: [serverConfig],
	}),
];

@Module({
	imports: (Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean)
		? [...baseImports, KeycloakModule]
		: baseImports,
	providers: [
		/** add console services as providers */
		ServerConsole,
	],
})
export class ServerConsoleModule {}
