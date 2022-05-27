import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsoleWriterModule } from '@shared/infra/console/console-writer/console-writer.module';
import { KeycloakModule } from '@shared/infra/identity-management/keycloak/keycloak.module';
import { FilesModule } from '@src/modules/files';
import { ManagementModule } from '@src/modules/management/management.module';
import serverConfig from '@src/server.config';
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
	],
	providers: [
		/** add console services as providers */
		ServerConsole,
	],
})
export class ServerConsoleModule {}
