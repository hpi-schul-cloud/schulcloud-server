import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { ServerModule } from './server.module';

@Module({
	imports: [ServerModule, ConsoleModule],
})
export class ServerConsoleModule {}
