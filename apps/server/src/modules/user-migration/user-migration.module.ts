import { Module } from '@nestjs/common';
import { SchoolModule } from '../school';
import { SystemModule } from '../system';
import { UserMigrationService } from './service/user-migration.service';

@Module({
	imports: [SchoolModule, SystemModule],
	providers: [UserMigrationService],
	exports: [UserMigrationService],
})
export class UserMigrationModule {}
