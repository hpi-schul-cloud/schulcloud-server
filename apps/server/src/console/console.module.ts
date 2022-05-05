import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsoleWriterModule } from '@shared/infra/console/console-writer/console-writer.module';
import { FilesModule } from '@src/modules/files';
import { ManagementModule } from '@src/modules/management/management.module';
import serverConfig from '@src/server.config';
import { ConsoleModule } from 'nestjs-console';
import { KeycloakModule } from '@shared/infra/identity-management/keycloak';
import { IdentityManagementConsole } from './identity-management.console';
import { ServerConsole } from './server.console';

@Module({
	imports: [
		ManagementModule,
		ConsoleModule,
		ConsoleWriterModule,
		FilesModule,
		KeycloakModule,
		ConfigModule.forRoot({
			isGlobal: true,
			validationOptions: { infer: true },
			load: [serverConfig],
		}),
	],
	providers: [
		/** add console services as providers */
		ServerConsole,
		IdentityManagementConsole,
	],
})
export class ServerConsoleModule {}
