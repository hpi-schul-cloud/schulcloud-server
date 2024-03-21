import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { ConsoleWriterModule } from '@infra/console';
import { IdpSyncConsole } from '@modules/idp-console/idp-sync-console';

@Module({
	imports: [ConsoleModule, ConsoleWriterModule],
	providers: [IdpSyncConsole],
})
export class IdpConsoleModule {}
