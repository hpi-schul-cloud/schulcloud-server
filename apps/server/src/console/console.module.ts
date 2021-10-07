import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { ConsoleWriterModule } from '@shared/infra/console/console-writer/console-writer.module';
import { ManagementModule } from '../modules/management/management.module';
import { ConsoleWriter } from './console-writer';
import { ServerConsole } from './server.console';

@Module({
	imports: [ManagementModule, ConsoleModule, ConsoleWriterModule],
	providers: [
		ConsoleWriter,
		/** add console services as providers */
		ServerConsole,
	],
})
export class ServerConsoleModule {}
