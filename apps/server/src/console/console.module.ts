import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { ConsoleWriterModule } from '@shared/infra/console/console-writer/console-writer.module';
import { ManagementModule } from '../modules/management/management.module';
import { FilesModule } from '../modules/files/files.module';
import { ServerConsole } from './server.console';

@Module({
	imports: [ManagementModule, ConsoleModule, ConsoleWriterModule, FilesModule],
	providers: [
		/** add console services as providers */
		ServerConsole,
	],
})
export class ServerConsoleModule {}
