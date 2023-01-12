import { Module } from '@nestjs/common';
import { SystemModule } from '@src/modules/system';
import { UserMigrationService } from './service/user-migration.service';

@Module({
	imports: [SystemModule],
	providers: [UserMigrationService],
	exports: [UserMigrationService],
})
export class UserMigrationModule {}
