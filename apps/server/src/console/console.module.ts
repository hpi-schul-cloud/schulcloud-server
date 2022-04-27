import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsoleWriterModule } from '@shared/infra/console/console-writer/console-writer.module';
import serverConfig from '@src/server.config';
import { ConsoleModule } from 'nestjs-console';
import { FilesModule } from '../modules/files/files.module';
import { ManagementModule } from '../modules/management/management.module';
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
	],
	providers: [
		/** add console services as providers */
		ServerConsole,
	],
})
export class ServerConsoleModule {}
