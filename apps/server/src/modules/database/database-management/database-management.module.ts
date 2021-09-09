import { Module } from '@nestjs/common';
import { DatabaseManagementController } from './database-management.controller';
import { ManagementService } from './database-management.service';

@Module({
	providers: [ManagementService],
	controllers: [DatabaseManagementController],
})
export class DatabaseManagementModule {}
