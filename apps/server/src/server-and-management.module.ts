import { Module } from '@nestjs/common';
import { DatabaseManagementModule } from './shared/infra/database-management/database-management.module';
import { ServerModule } from './server.module';

@Module({
	imports: [ServerModule, DatabaseManagementModule],
})
export class ServerAndManagementModule {}
