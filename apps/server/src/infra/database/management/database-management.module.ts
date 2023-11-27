import { Module } from '@nestjs/common';
import { DatabaseManagementService } from './database-management.service';

@Module({
	providers: [DatabaseManagementService],
	exports: [DatabaseManagementService],
})
export class DatabaseManagementModule {}
