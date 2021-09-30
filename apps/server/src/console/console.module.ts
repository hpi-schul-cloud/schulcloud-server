import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { ConsoleWriterModule } from '@shared/infra/console/console-writer/console-writer.module';
import { ManagementModule } from '../modules/management/management.module';

@Module({
	imports: [ManagementModule, ConsoleModule, ConsoleWriterModule],
})
export class ServerConsoleModule {}
