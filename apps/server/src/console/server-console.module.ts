import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { ServerConsole } from './server.console';
import { ServerModule } from '../server.module';
import { ConsoleWriter } from './console-writer/console-writer.service';

@Module({
	imports: [ServerModule, ConsoleModule],
	providers: [
		ConsoleWriter,
		/** add console services as providers */
		ServerConsole,
	],
})
export class ServerConsoleModule {}
