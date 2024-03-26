import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { ConsoleWriterModule } from '@infra/console';
import { SynchronizationUc } from '@modules/synchronization';
import { IdpSyncConsole } from './idp-sync-console';

@Module({
	imports: [ConsoleModule, ConsoleWriterModule],
	providers: [SynchronizationUc, IdpSyncConsole],
})
export class IdpConsoleModule {}
