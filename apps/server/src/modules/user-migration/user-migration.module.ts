import { Module } from '@nestjs/common';
import { SchoolModule } from '../school';
import { UserMigrationService } from './service/user-migration.service';

@Module({
	imports: [SchoolModule],
	providers: [UserMigrationService],
	exports: [UserMigrationService],
})
export class UserMigrationModule {}
