import { Module } from '@nestjs/common';
import { SchoolModule } from '@src/modules/school';
import { SystemModule } from '@src/modules/system';
import { UserMigrationService } from './service';

@Module({
	imports: [SchoolModule, SystemModule],
	providers: [UserMigrationService],
	exports: [UserMigrationService],
})
export class UserMigrationModule {}
