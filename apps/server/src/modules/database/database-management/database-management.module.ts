import { Module } from '@nestjs/common';
import { DatabaseManagementController } from './database-management.controller';
import { DatabaseManagementService } from './database-management.service';

@Module({
	providers: [DatabaseManagementService],
	controllers: [DatabaseManagementController],
})
export class DatabaseManagementModule {}
