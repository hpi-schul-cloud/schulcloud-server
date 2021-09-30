import { Module } from '@nestjs/common';
import { DatabaseManagementController } from './database-management.controller';
import { DatabaseManagementUc } from './database-management.uc';
import { DatabaseManagementService } from './database-management.service';
import { BsonConverter } from './bson.converter';

@Module({
	providers: [DatabaseManagementUc, DatabaseManagementService, BsonConverter],
	exports: [DatabaseManagementUc],
	controllers: [DatabaseManagementController],
})
export class DatabaseManagementModule {}
