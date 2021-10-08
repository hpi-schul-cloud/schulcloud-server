import { Module } from '@nestjs/common';
import { DatabaseManagementService } from './database-management.service';

@Module({
	imports: [DatabaseManagementService],
	exports: [DatabaseManagementService],
})
export class DatabaseManagementModule {}
