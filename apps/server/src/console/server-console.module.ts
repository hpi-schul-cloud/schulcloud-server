import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { ServerConsole } from './server.console';
import { ConsoleWriter } from './console-writer/console-writer.service';
import { DatabaseManagementConsole } from './database-management.console';
import { ServerModule } from '../server.module';
import { DatabaseManagementModule } from '../modules/database/database-management/database-management.module';

@Module({
	imports: [ServerModule, DatabaseManagementModule, ConsoleModule],
	providers: [
		ConsoleWriter,
		/** add console services as providers */
		ServerConsole,
		DatabaseManagementConsole,
	],
})
export class ServerConsoleModule {}
